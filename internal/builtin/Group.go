package builtin

import (
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
)

// Group represents a group node for organizing other nodes
type Group struct {
	*node.Entity
	// Note: Group nodes don't have configs
}

// loadGroup creates a Group node from an existing Entity loaded from database
func loadGroup(identity *node.Entity) (node.Node, error) {
	// Create Group node with the loaded identity
	group := &Group{
		Entity: identity,
	}

	// Group nodes have no configuration to load
	return group, nil
}

// newGroup creates a new Group node instance
func newGroup(entity *node.Entity) *Group {
	return &Group{
		Entity: entity,
	}
}

// Save persists the Group node to the database
func (n *Group) Save() error {
	// Note: Only saves Entity, no config for Group nodes
	return node.DB.Save(n.Entity).Error
}

// Run starts the Group node goroutine and message loop
func (n *Group) Run() {
	go n.messageLoop()
}

// Shutdown gracefully shuts down the Group node and all children
func (n *Group) Shutdown() {
	// Node-specific cleanup can be added here
}

// messageLoop handles incoming messages
func (n *Group) messageLoop() {
	for m := range n.Incoming {
		var a any
		var err error

		// TODO: Pre-process: authorization check

		// Route based on message type
		if m.Type < msg.CommonMsgSeparator {
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
