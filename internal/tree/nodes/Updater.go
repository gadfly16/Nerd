package nodes

import (
	"github.com/gadfly16/nerd/internal/tree/system"
)

// Updater represents an updater node for propagating updates upstream
type Updater struct {
	identity *Identity
	// Note: Updater nodes don't have configs
	incoming system.Pipe
	sys      *system.System
}

// NewUpdater creates a new Updater node instance
func NewUpdater(sys *system.System) *Updater {
	incoming := make(system.Pipe, 100)
	return &Updater{
		sys:      sys,
		incoming: incoming,
	}
}

// Save persists the Updater node to the database
func (up *Updater) Save(dbPath string) error {
	// TODO: Implement database save operation
	// Note: Only saves Identity, no config for Updater nodes
	return nil
}

// Load retrieves the Updater node from the database
func (up *Updater) Load(dbPath string) error {
	// TODO: Implement database load operation
	return nil
}

// Run starts the Updater node goroutine and message loop
func (up *Updater) Run() {
	if up.identity != nil {
		up.sys.AddNode(up.identity.ID, up.incoming)
	}
	go up.messageLoop()
}

// LoadChildren recursively loads and starts all descendant nodes
func (up *Updater) LoadChildren(dbPath string) error {
	// TODO: Implement recursive child loading
	return nil
}

// Shutdown gracefully shuts down the Updater node
func (up *Updater) Shutdown() error {
	// TODO: Implement graceful shutdown
	return nil
}

// messageLoop handles incoming messages
func (up *Updater) messageLoop() {
	for msg := range up.incoming {
		switch msg.Type {
		case system.CreateChildMessage:
			up.handleCreateChild(msg)
		case system.ShutdownMessage:
			up.handleShutdown(msg)
		default:
			// Unknown message type
		}
	}
}

// handleCreateChild processes requests to create child nodes
func (up *Updater) handleCreateChild(msg *system.Message) {
	// TODO: Implement child creation
}

// handleShutdown processes shutdown requests
func (up *Updater) handleShutdown(msg *system.Message) {
	// TODO: Implement shutdown handling
}
