package builtin

import (
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// NewNode creates a new node instance based on the specified type and name
// If name is empty, auto-generation will be used
func NewNode(pe *node.Entity, pl msg.CreateChildPayload) (node.Node, error) {
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
	case nerd.UserNode:
		// First user is automatically admin
		e.Admin = len(pe.Children) == 0
		return newUser(e, pl)
	case nerd.AuthenticatorNode:
		return newAuthenticator(e), nil
	case nerd.TopoUpdaterNode:
		return newTopoUpdater(e)
	default:
		// At this point the createChildHandler already checked the node type
		panic("nodes: trying to create unsupported node type")
	}
}
