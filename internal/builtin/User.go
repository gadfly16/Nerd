package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user node for authentication
type User struct {
	*node.Entity
	config *UserConfig
}

// UserConfig stores configuration for User nodes
type UserConfig struct {
	node.ConfigModel
	Password string `gorm:"not null"` // Hashed password
}

// loadUser creates a User node from an existing Entity loaded from database
func loadUser(identity *node.Entity) (node.Node, error) {
	// Create User node with the loaded identity
	user := &User{
		Entity: identity,
		config: &UserConfig{},
	}

	// Load User's specific configuration from database
	result := node.DB.Where("identity_id = ?", identity.NodeID).First(user.config)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to load user config: %w", result.Error)
	}

	return user, nil
}

func newUser(e *node.Entity, pl msg.CreateChildPayload) (*User, error) {
	guipl, ok := pl.Spec.(map[string]any)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	pw, ok := guipl["password"].(string)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	return &User{
		Entity: e,
		config: &UserConfig{
			Password: string(hashedPassword),
		},
	}, nil
}

// Save persists the User node to the database
func (n *User) Save() error {
	return node.DB.Transaction(func(tx *gorm.DB) error {
		// Save Entity record (handles both insert and update)
		if err := tx.Save(n.Entity).Error; err != nil {
			return err
		}

		// Update IdentityID reference
		n.config.IdentityID = n.Entity.Tag.NodeID

		// Save UserConfig record (handles both insert and update)
		if err := tx.Save(n.config).Error; err != nil {
			return err
		}

		return nil
	})
}

// Run starts the User node goroutine and message loop
func (n *User) Run() {
	go n.messageLoop()
}

// Shutdown gracefully shuts down the User node
func (n *User) Shutdown() {
	// Node-specific cleanup can be added here
}

// verifyPassword checks if the provided password matches the stored hash
func (n *User) verifyPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(n.config.Password), []byte(password))
}

// messageLoop handles incoming messages
func (n *User) messageLoop() {
	for m := range n.Incoming {
		var a any
		var err error

		// TODO: Pre-process: authorization check

		// Route based on message type
		if m.Type < msg.COMMON_MSG_SEPARATOR {
			// Common message - handle via Entity
			a, err = handleCommonMessage(&m, n)
		} else {
			// Node-specific message handling
			switch m.Type {
			case msg.AuthenticateSelf:
				a, err = n.handleAuthenticate(&m)
			default:
				err = nerd.ErrUnknownMessageType
			}
		}

		// Post-process: apply any response filtering, logging, etc.
		// TODO: Add post-processing logic here

		// Send response
		m.Reply(a, err)

		// Exit the message loop in case of shutdown. The message is already
		// handled as a common message
		if m.Type == msg.Shutdown {
			break
		}
	}
}

// handleAuthenticate verifies the password
func (n *User) handleAuthenticate(m *msg.Msg) (any, error) {
	pl, ok := m.Payload.(string)
	if !ok {
		return nil, fmt.Errorf("invalid pl type for Authenticate")
	}

	err := n.verifyPassword(pl)
	if err != nil {
		return nil, fmt.Errorf("authentication failed")
	}

	return n.Tag, nil
}
