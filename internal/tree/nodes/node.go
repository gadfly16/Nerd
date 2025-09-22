package nodes

import "github.com/gadfly16/nerd/internal/tree/nerd"

// NewNode creates a new node instance based on the specified type
func NewNode(nodeType nerd.NodeType) (nerd.Node, error) {
	switch nodeType {
	case nerd.GroupNode:
		return NewGroup(), nil
	case nerd.RootNode:
		// Root nodes require special initialization with dbPath
		// For child creation, this shouldn't normally happen
		return nil, nerd.ErrUnsupportedNodeType
	default:
		return nil, nerd.ErrUnsupportedNodeType
	}
}
