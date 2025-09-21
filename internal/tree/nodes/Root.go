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

// Save persists the Root node to the database
func (r *Root) Save() error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Save Identity record first to get auto-generated ID
		if err := tx.Create(r.Identity).Error; err != nil {
			return err
		}

		// Update IdentityID reference
		r.config.IdentityID = r.Identity.Tag.NodeID

		// Save RootConfig record
		if err := tx.Create(r.config).Error; err != nil {
			return err
		}

		return nil
	})
}

// Load retrieves the Root node and all children from the database
func (r *Root) Load() error {
	// TODO: Implement database load operation
	// 1. Load Identity and Config from database
	// 2. Populate struct fields
	// 3. Load all children recursively
	// 4. Start children nodes
	return nil
}

// Run starts the Root node goroutine and message loop
func (r *Root) Run() {
	// Note: Tree package handles node registration during lifecycle management
	// Start message loop
	go r.messageLoop()
}

// Shutdown gracefully shuts down the Root node and all children
func (r *Root) Shutdown() {
	// TODO: Implement graceful shutdown
	// 1. Ask all children to shutdown (blocking)
	// 2. Wait for all child goroutines to complete
	// 3. Clean up resources and exit
}

// messageLoop handles incoming messages
func (r *Root) messageLoop() {
	for msg := range r.Incoming {
		switch msg.Type {
		case nerd.CreateChildMessage:
			r.handleCreateChild(&msg)
		case nerd.ShutdownMessage:
			r.handleShutdown(&msg)
		default:
			// Unknown message type
		}
	}
}

// handleCreateChild processes requests to create child nodes
func (r *Root) handleCreateChild(msg *nerd.Message) {
	// TODO: Implement child creation
	// 1. Parse message payload for node type and config
	// 2. Create appropriate node instance
	// 3. Call Save() and Run() on new child
	// 4. Send response if this was an Ask
}

// handleShutdown processes shutdown requests
func (r *Root) handleShutdown(msg *nerd.Message) {
	// TODO: Implement shutdown handling
	// 1. Initiate graceful shutdown of all children
	// 2. Wait for completion
	// 3. Send response and exit message loop
}
