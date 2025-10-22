package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/node"
	"github.com/gadfly16/nerd/sdk/msg"
)

// System holds references to system nodes for easy access
type SystemNodes struct {
	Authenticator *msg.Tag
}

// System provides access to system node tags
var System = &SystemNodes{}

// NewNode creates a new node instance based on the specified type and name
// If name is empty, auto-generation will be used
func NewNode(nodeType nerd.NodeType, name string) node.Node {
	id := node.NewID()

	// Auto-generate name if not provided
	if name == "" {
		name = fmt.Sprintf("New %s #%d", nerd.NodeTypeName(nodeType), id)
	}

	// Create base Entity with common fields initialized
	entity := &node.Entity{
		Tag: &msg.Tag{
			NodeID:   id,
			Incoming: make(msg.MsgChan),
		},
		Name:     name,
		NodeType: nodeType,
		Children: make(map[string]*msg.Tag),
	}

	switch nodeType {
	case nerd.GroupNode:
		return newGroup(entity)
	case nerd.RootNode:
		return newRoot(entity)
	case nerd.AuthenticatorNode:
		return newAuthenticator(entity)
	default:
		// At this point the createChildHandler already checked the node type
		panic("nodes: trying to create unsupported node type")
	}
}
