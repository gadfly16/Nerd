package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// Authenticator represents the authentication singleton node
type Authenticator struct {
	*node.Entity
	// Note: Authenticator nodes don't have configs
}

// loadAuthenticator creates an Authenticator node from an existing Entity loaded from database
func loadAuthenticator(identity *node.Entity) (node.Node, error) {
	// Create Authenticator node with the loaded identity
	auth := &Authenticator{
		Entity: identity,
	}

	// Register as system singleton
	node.System.Authenticator = identity.Tag

	// Authenticator nodes have no configuration to load
	return auth, nil
}

// newAuthenticator creates a new Authenticator node instance
func newAuthenticator(entity *node.Entity) *Authenticator {
	auth := &Authenticator{
		Entity: entity,
	}

	// Register as system node for easy access
	node.System.Authenticator = entity.Tag

	return auth
}

// Save persists the Authenticator node to the database
func (n *Authenticator) Save() error {
	// Note: Only saves Entity, no config for Authenticator nodes
	return node.DB.Save(n.Entity).Error
}

// Run starts the Authenticator node goroutine and message loop
func (n *Authenticator) Run() {
	go n.messageLoop()
}

// Shutdown gracefully shuts down the Authenticator node and all children
func (n *Authenticator) Shutdown() {
	// Clear system reference
	node.System.Authenticator = nil
}

// messageLoop handles incoming messages
func (n *Authenticator) messageLoop() {
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
			case msg.AuthenticateUser:
				a, err = n.handleAuthenticateUser(&m)
			default:
				err = nerd.ErrUnknownMessageType
			}
		}

		// Post-process: apply any response filtering, logging, etc.
		// TODO: Add post-processing logic here

		// Send response
		m.Reply(a, err)

		// Exit the message loop in case of shutdown or delete self.
		if m.Type == msg.Shutdown {
			break
		}
	}
}

// handleAuthenticateUser authenticates a user by username and password
func (n *Authenticator) handleAuthenticateUser(m *msg.Msg) (any, error) {
	pl, ok := m.Payload.(msg.CredentialsPayload)
	if !ok {
		return nil, fmt.Errorf("invalid pl type for AuthenticateUser")
	}

	// Look up user by name
	userTag, exists := n.Children[pl.Username]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}

	// Forward Authenticate message to user
	return userTag.AskAuthenticate(pl.Password)
}

// handleCreateUser creates a new user node
// func (n *Authenticator) handleCreateUser(m *msg.Msg) (any, error) {
// 	pl, ok := m.Payload.(msg.CredentialsPayload)
// 	if !ok {
// 		return nil, fmt.Errorf("invalid pl type for CreateUser")
// 	}

// 	// Check if user already exists
// 	if _, exists := n.Children[pl.Username]; exists {
// 		return nil, fmt.Errorf("user already exists")
// 	}

// 	// First user is automatically admin
// 	isAdmin := len(n.Children) == 0

// 	// Create new user node
// 	user, err := newUser(pl.Username, pl.Password, isAdmin)
// 	if err != nil {
// 		return nil, err
// 	}

// 	// Save user to database
// 	if err := user.Save(); err != nil {
// 		return nil, fmt.Errorf("failed to save user: %w", err)
// 	}

// 	// Add to children map
// 	n.Children[pl.Username] = user.Tag

// 	// Update parent-child relationship in database
// 	user.SetParentID(n.GetID())
// 	if err := user.Save(); err != nil {
// 		return nil, fmt.Errorf("failed to update user parent: %w", err)
// 	}

// 	// Start user node
// 	user.Run()

// 	// Register user node
// 	user.Tag.Register()

// 	// Create Clients group under new user
// 	_, err = user.Tag.AskCreateChild(nerd.GroupNode, "Clients", nil)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to create Clients group: %w", err)
// 	}

// 	// Invalidate tree cache
// 	n.InvalidateTreeEntry()

// 	return user.Tag, nil
// }
