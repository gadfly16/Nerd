package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
)

// Group represents a group node for organizing other nodes
type Group struct {
	*node.Identity
	// Note: Group nodes don't have configs
}

// newGroup creates a new Group node instance with the specified name
// If name is empty, auto-generates name based on node ID
func newGroup(name string) *Group {
	incoming := make(msg.MsgChan) // Unbuffered channel for synchronous message delivery
	id := node.NewID()

	// Use provided name or auto-generate
	nodeName := name
	if nodeName == "" {
		nodeName = fmt.Sprintf("New Group #%d", id)
	}

	return &Group{
		Identity: &node.Identity{
			Tag: &msg.Tag{
				NodeID:   id,
				Incoming: incoming,
			},
			Name:     nodeName,
			NodeType: node.Group,
			Children: make(map[string]*msg.Tag),
		},
	}
}

// GetNodeTypeName returns the human-readable name for this node type
func (n *Group) GetNodeTypeName() string {
	return "Group"
}

// Save persists the Group node to the database
func (n *Group) Save() error {
	// Note: Only saves Identity, no config for Group nodes
	return node.DB.Save(n.Identity).Error
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
	go n.messageLoop()
}

// Shutdown gracefully shuts down the Group node and all children
func (n *Group) Shutdown() {
	fmt.Printf("Shutting down Group node %s\n", n.Identity.Name)
}

// messageLoop handles incoming messages
func (n *Group) messageLoop() {
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
