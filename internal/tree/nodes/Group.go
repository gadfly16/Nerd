package nodes

import "github.com/gadfly16/nerd/internal/tree/nerd"

// Group represents a group node for organizing other nodes
type Group struct {
	*Identity
	// Note: Group nodes don't have configs
}

// NewGroup creates a new Group node instance
func NewGroup() *Group {
	incoming := make(nerd.Pipe, 100)
	return &Group{
		Identity: &Identity{
			Name:     "group",
			NodeType: nerd.GroupNode,
			Incoming: incoming,
		},
	}
}

// Save persists the Group node to the database
func (g *Group) Save(dbPath string) error {
	// TODO: Implement database save operation
	// Note: Only saves Identity, no config for Group nodes
	return nil
}

// Load retrieves the Group node and all children from the database
func (g *Group) Load(dbPath string) error {
	// TODO: Implement database load operation
	// 1. Load Identity from database
	// 2. Populate struct fields
	// 3. Load all children recursively
	// 4. Start children nodes
	return nil
}

// Run starts the Group node goroutine and message loop
func (g *Group) Run() {
	// Note: Tree package handles node registration during lifecycle management
	go g.messageLoop()
}

// Shutdown gracefully shuts down the Group node and all children
func (g *Group) Shutdown() {
	// TODO: Implement graceful shutdown
	// 1. Ask all children to shutdown (blocking)
	// 2. Wait for all child goroutines to complete
	// 3. Clean up resources and exit
}

// messageLoop handles incoming messages
func (g *Group) messageLoop() {
	for msg := range g.Incoming {
		switch msg.Type {
		case nerd.CreateChildMessage:
			g.handleCreateChild(&msg)
		case nerd.ShutdownMessage:
			g.handleShutdown(&msg)
		default:
			// Unknown message type
		}
	}
}

// handleCreateChild processes requests to create child nodes
func (g *Group) handleCreateChild(msg *nerd.Message) {
	// TODO: Implement child creation
}

// handleShutdown processes shutdown requests
func (g *Group) handleShutdown(msg *nerd.Message) {
	// TODO: Implement shutdown handling
}
