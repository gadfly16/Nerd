package builtin

import (
	"log"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// TopoUpdater is a runtime node that manages GUI subscriptions and relays topology updates
type TopoUpdater struct {
	*node.Entity
	guiNodes map[*msg.Tag]struct{} // Registered GUI nodes
}

// newTopoUpdater creates a new TopoUpdater node instance
func newTopoUpdater(e *node.Entity) (*TopoUpdater, error) {
	// Ensure only one TopoUpdater exists
	if node.System.TopoUpdater != nil {
		panic("TopoUpdater already exists")
	}

	tu := &TopoUpdater{
		Entity:   e,
		guiNodes: make(map[*msg.Tag]struct{}),
	}

	// Register as system singleton
	node.System.TopoUpdater = e.Tag

	return tu, nil
}

// Save panics for TopoUpdater nodes (runtime, should never be persisted)
func (n *TopoUpdater) Save() error {
	panic("TopoUpdater.Save() called - TopoUpdater nodes are runtime and should never be saved")
}

// Run starts the TopoUpdater node goroutine and message loop
func (n *TopoUpdater) Run() {
	go n.messageLoop()
}

// Shutdown gracefully shuts down the TopoUpdater node
func (n *TopoUpdater) Shutdown() {
	// Clear system reference
	node.System.TopoUpdater = nil
}

// messageLoop handles incoming messages
func (n *TopoUpdater) messageLoop() {
	for m := range n.Incoming {
		var a any
		var err error

		// Route based on message type
		if m.Type < msg.COMMON_MSG_SEPARATOR {
			// Common message - handle via Entity
			a, err = handleCommonMessage(&m, n)
		} else {
			// Node-specific message handling
			switch m.Type {
			case msg.TopoSubscribe:
				a, err = n.handleTopoSubscribe(&m)
			case msg.TopoUnsubscribe:
				a, err = n.handleTopoUnsubscribe(&m)
			case msg.TopoUpdate:
				a, err = n.handleTopoUpdate(&m)
			default:
				err = nerd.ErrUnknownMessageType
			}
		}

		// Send response
		m.Reply(a, err)

		// Exit the message loop in case of shutdown or delete self
		if m.Type == msg.Shutdown {
			break
		}
	}
}

// handleTopoSubscribe registers a GUI node for topology updates
func (n *TopoUpdater) handleTopoSubscribe(m *msg.Msg) (any, error) {
	guiTag, ok := m.Payload.(*msg.Tag)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	n.guiNodes[guiTag] = struct{}{}

	log.Printf("TopoUpdater: Registered GUI node %d for topology updates", guiTag.NodeID)
	return nil, nil
}

// handleTopoUnsubscribe unregisters a GUI node
func (n *TopoUpdater) handleTopoUnsubscribe(m *msg.Msg) (any, error) {
	guiTag, ok := m.Payload.(*msg.Tag)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	delete(n.guiNodes, guiTag)

	log.Printf("TopoUpdater: Unregistered GUI node %d", guiTag.NodeID)
	return nil, nil
}

// handleTopoUpdate broadcasts topology updates to all registered GUI nodes
func (n *TopoUpdater) handleTopoUpdate(m *msg.Msg) (any, error) {
	// Broadcast the update to all GUI nodes
	log.Printf("TopoUpdater: Broadcasting topology update to %d GUI nodes", len(n.guiNodes))
	for guiTag := range n.guiNodes {
		// Use Notify for fire-and-forget delivery
		guiTag.Notify(&msg.Msg{
			Type:    msg.TopoUpdate,
			Payload: m.Payload,
		})
	}

	return nil, nil
}
