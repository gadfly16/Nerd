package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/node"
)

// loadNodeFromEntity creates a node from an existing Entity using a switch statement
func loadNodeFromEntity(e *node.Entity) (node.Node, error) {
	switch e.NodeType {
	case nerd.RootNode:
		return loadRoot(e)
	case nerd.GroupNode:
		return loadGroup(e)
	case nerd.AuthenticatorNode:
		return loadAuthenticator(e)
	case nerd.UserNode:
		return loadUser(e)
	default:
		panic(fmt.Sprintf("loading unsupported node type: %d", e.NodeType))
	}
}

func init() {
	// Register the switch-based loader
	node.LoadNodeFromEntity = loadNodeFromEntity
}
