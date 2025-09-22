package nodes

import (
	"github.com/gadfly16/nerd/internal/tree/nerd"
)

// Group represents a group node for organizing other nodes
type Group struct {
	*Identity
	// Note: Group nodes don't have configs
}

// NewGroup creates a new Group node instance
func NewGroup() *Group {
	incoming := make(nerd.Pipe) // Unbuffered channel for synchronous message delivery
	return &Group{
		Identity: &Identity{
			Tag: &nerd.Tag{
				Incoming: incoming,
			},
			Name:     "group",
			NodeType: nerd.GroupNode,
		},
	}
}

// Save persists the Group node to the database
func (n *Group) Save() error {
	// Note: Only saves Identity, no config for Group nodes
	return db.Create(n.Identity).Error
}

// Load retrieves the Group node and all children from the database
func (n *Group) Load() error {
	// TODO: Implement database load operation
	// 1. Load Identity from database
	// 2. Populate struct fields
	// 3. Load all children recursively
	// 4. Start children nodes
	return nil
}

// Run starts the Group node goroutine and message loop
func (n *Group) Run() {
	// Note: Tree package handles node registration during lifecycle management
	go n.messageLoop()
}

// Shutdown gracefully shuts down the Group node and all children
func (n *Group) Shutdown() {
	// TODO: Implement graceful shutdown
	// 1. Ask all children to shutdown (blocking)
	// 2. Wait for all child goroutines to complete
	// 3. Clean up resources and exit
}

// messageLoop handles incoming messages
func (n *Group) messageLoop() {
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
