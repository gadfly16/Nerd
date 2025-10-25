package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
	"gorm.io/gorm"
)

// Root represents the root node of the tree
type Root struct {
	*node.Entity
	config *RootConfig
}

// RootConfig stores configuration for Root nodes
type RootConfig struct {
	node.ConfigModel
	LogLevel int `gorm:"not null"`
}

// loadRoot creates a Root node from an existing Entity loaded from database
func loadRoot(identity *node.Entity) (node.Node, error) {
	// Create Root node with the loaded identity
	root := &Root{
		Entity: identity,
		config: &RootConfig{},
	}

	// Load Root's specific configuration from database
	result := node.DB.Where("identity_id = ?", identity.NodeID).First(root.config)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to load root config: %w", result.Error)
	}

	return root, nil
}

// NewRoot creates a new Root node instance
func NewRoot() *Root {
	e := &node.Entity{
		Tag: &msg.Tag{
			NodeID:   node.NewPersistentID(),
			Incoming: make(msg.MsgChan),
		},
		Name:          "Root",
		NodeType:      nerd.RootNode,
		Children:      make(map[string]*msg.Tag),
		CacheValidity: node.CacheValidity{},
	}

	return &Root{
		Entity: e,
		config: &RootConfig{},
	}
}

// Save persists the Root node to the database
func (n *Root) Save() error {
	return node.DB.Transaction(func(tx *gorm.DB) error {
		// Save Entity record (handles both insert and update)
		if err := tx.Save(n.Entity).Error; err != nil {
			return err
		}

		// Update IdentityID reference
		n.config.IdentityID = n.Entity.Tag.NodeID

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
	// Node-specific cleanup can be added here
}

// messageLoop handles incoming messages
func (n *Root) messageLoop() {
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
