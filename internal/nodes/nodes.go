package nodes

import "github.com/gadfly16/nerd/internal/nerd"

const (
	GroupNode nerd.NodeType = iota
	RootNode
)

// NewNode creates a new node instance based on the specified type and name
// If name is empty, auto-generation will be used. Root nodes always use "root" regardless of name parameter.
func NewNode(nodeType nerd.NodeType, name string) nerd.Node {
	switch nodeType {
	case GroupNode:
		return newGroup(name)
	case RootNode:
		return newRoot() // Root doesn't need name parameter, always "root"
	default:
		// At this point the createChildHandler already checked the node type
		panic("nodes: trying to create unsupported node type")
	}
}
