package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
	"gorm.io/gorm"
)

// Root represents the root node of the tree
type Root struct {
	*node.Identity
	config *RootConfig
}

// RootConfig stores configuration for Root nodes
type RootConfig struct {
	node.ConfigModel
	LogLevel int `gorm:"not null"`
}

// LoadRoot creates a Root node from an existing Identity loaded from database
func LoadRoot(identity *node.Identity) (node.Node, error) {
	// Create Root node with the loaded identity
	root := &Root{
		Identity: identity,
		config:   &RootConfig{},
	}

	// Load Root's specific configuration from database
	result := node.DB.Where("identity_id = ?", identity.NodeID).First(root.config)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to load root config: %w", result.Error)
	}

	return root, nil
}

// NewRoot creates a new Root node instance with specified database path
func newRoot() *Root {
	id := node.NewID()
	if id != 1 {
		panic("A Root node seems to already exist")
	}
	return &Root{
		Identity: &node.Identity{
			Tag: &msg.Tag{
				NodeID:   id,
				Incoming: make(msg.MsgChan),
			},
			Name:     "Root",
			NodeType: node.Root,
			Children: make(map[string]*msg.Tag),
		},
		config: &RootConfig{},
	}
}

// GetNodeTypeName returns the human-readable name for this node type
func (n *Root) GetNodeTypeName() string {
	return "Root"
}

// Save persists the Root node to the database
func (n *Root) Save() error {
	return node.DB.Transaction(func(tx *gorm.DB) error {
		// Save Identity record (handles both insert and update)
		if err := tx.Save(n.Identity).Error; err != nil {
			return err
		}

		// Update IdentityID reference
		n.config.IdentityID = n.Identity.Tag.NodeID

		// Save RootConfig record (handles both insert and update)
		if err := tx.Save(n.config).Error; err != nil {
			return err
		}

		return nil
	})
}

// Run starts the Root node goroutine and message loop
func (n *Root) Run() {
	// Start message loop
	go n.messageLoop()
}

// Shutdown gracefully shuts down the Root node and all children
func (n *Root) Shutdown() {
	fmt.Printf("Shutting down Root node.\n")
}

// messageLoop handles incoming messages
func (n *Root) messageLoop() {
	for m := range n.Incoming {
		var a any
		var err error

		// TODO: Pre-process: authorization check

		// Route based on message type
		if m.Type < msg.CommonMsgSeparator {
			// Common message - handle via Identity
			a, err = handleCommonMessage(&m, n)
		} else {
			// Node-specific message handling
			switch m.Type {
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
