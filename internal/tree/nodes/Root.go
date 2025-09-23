package nodes

import (
	"github.com/gadfly16/nerd/internal/tree/nerd"
	"gorm.io/gorm"
)

// Root represents the root node of the tree
type Root struct {
	*Identity
	config *RootConfig
}

// RootConfig stores configuration for Root nodes
type RootConfig struct {
	ConfigModel
	DatabasePath string `gorm:"not null"`
}

// NewRoot creates a new Root node instance with specified database path
func NewRoot(dbPath string) *Root {
	incoming := make(nerd.Pipe) // Unbuffered channel for synchronous message delivery
	return &Root{
		Identity: &Identity{
			Tag: &nerd.Tag{
				Incoming: incoming,
			},
			Name:     "root",
			NodeType: nerd.RootNode,
		},
		config: &RootConfig{
			DatabasePath: dbPath,
		},
	}
}

// GetNodeTypeName returns the human-readable name for this node type
func (n *Root) GetNodeTypeName() string {
	return "Root"
}

// Save persists the Root node to the database
func (n *Root) Save() error {
	return db.Transaction(func(tx *gorm.DB) error {
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

// Load retrieves the Root node and all children from the database
func (n *Root) Load() error {
	// TODO: Implement database load operation
	// 1. Load Identity and Config from database
	// 2. Populate struct fields
	// 3. Load all children recursively
	// 4. Start children nodes
	return nil
}

// Run starts the Root node goroutine and message loop
func (n *Root) Run() {
	// Note: Tree package handles node registration during lifecycle management
	// Start message loop
	go n.messageLoop()
}

// Shutdown gracefully shuts down the Root node and all children
func (n *Root) Shutdown() {
	// TODO: Implement graceful shutdown
	// 1. Ask all children to shutdown (blocking)
	// 2. Wait for all child goroutines to complete
	// 3. Clean up resources and exit
}

// messageLoop handles incoming messages
func (n *Root) messageLoop() {
	for m := range n.Incoming {
		var a any
		var err error

		// TODO: Pre-process: authorization check

		// Route based on message type
		if m.Type < nerd.CommonMsgSeparator {
			// Common message - handle via Identity
			a, err = n.Identity.handleCommonMessage(&m, n)
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
	}
}
