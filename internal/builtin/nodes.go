package builtin

import (
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// System holds references to system nodes for easy access
type SystemNodes struct {
	Authenticator *msg.Tag
}

// System provides access to system node tags
var System = &SystemNodes{}

// newNode creates a new node instance based on the specified type and name
// If name is empty, auto-generation will be used
func newNode(pl msg.CreateChildPayload) (node.Node, error) {
	ti := pl.NodeType.Info()
	var id nerd.NodeID
	if ti.Runtime {
		id = node.NewRuntimeID()
	} else {
		id = node.NewPersistentID()
	}

	// Create base Entity with common fields initialized
	e := &node.Entity{
		Tag: &msg.Tag{
			NodeID:   id,
			Incoming: make(msg.MsgChan),
		},
		Name:     pl.Name,
		NodeType: pl.NodeType,
		Children: make(map[string]*msg.Tag),
	}

	switch pl.NodeType {
	case nerd.GroupNode:
		return newGroup(e), nil
	case nerd.GUINode:
		return newGUI(e, pl)
	case nerd.AuthenticatorNode:
		return newAuthenticator(e), nil
	default:
		// At this point the createChildHandler already checked the node type
		panic("nodes: trying to create unsupported node type")
	}
}
