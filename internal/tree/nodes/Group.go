package nodes

import "github.com/gadfly16/nerd/internal/tree/nerd"

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
	for msg := range n.Incoming {
		switch msg.Type {
		case nerd.CreateChildMessage:
			n.handleCreateChild(&msg)
		case nerd.ShutdownMessage:
			n.handleShutdown(&msg)
		default:
			// Unknown message type
		}
	}
}

// handleCreateChild processes requests to create child nodes
func (n *Group) handleCreateChild(msg *nerd.Message) {
	// TODO: Implement child creation
}

// handleShutdown processes shutdown requests
func (n *Group) handleShutdown(msg *nerd.Message) {
	// TODO: Implement shutdown handling
}
