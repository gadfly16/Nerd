package builtin

import (
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
)

// NewNode creates a new node instance based on the specified type and name
// If name is empty, auto-generation will be used. Root nodes always use "root" regardless of name parameter.
func NewNode(nodeType nerd.NodeType, name string) node.Node {
	switch nodeType {
	case node.Group:
		return newGroup(name)
	case node.Root:
		return newRoot() // Root doesn't need name parameter, always "root"
	default:
		// At this point the createChildHandler already checked the node type
		panic("nodes: trying to create unsupported node type")
	}
}
