package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/node"
)

// loadNodeFromIdentity creates a node from an existing Identity using a switch statement
func loadNodeFromIdentity(identity *node.Identity) (node.Node, error) {
	switch identity.NodeType {
	case node.Root:
		return loadRoot(identity)
	case node.Group:
		return loadGroup(identity)
	default:
		panic(fmt.Sprintf("unsupported node type: %d", identity.NodeType))
	}
}

func init() {
	// Register the switch-based loader
	node.LoadNodeFromIdentity = loadNodeFromIdentity
}
