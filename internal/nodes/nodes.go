package nodes

import "github.com/gadfly16/nerd/internal/nerd"

const (
	GroupNode nerd.NodeType = iota
	RootNode
)

// NewNode creates a new node instance based on the specified type
func NewNode(nodeType nerd.NodeType) nerd.Node {
	switch nodeType {
	case GroupNode:
		return newGroup()
	case RootNode:
		return newRoot()
	default:
		// At this point the createChildHandler already checked the node type
		panic("nodes: trying to create unsupported node type")
	}
}
