package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/node"
)

// loadNodeFromIdentity creates a node from an existing Entity using a switch statement
func loadNodeFromIdentity(identity *node.Entity) (node.Node, error) {
	switch identity.NodeType {
	case nerd.RootNode:
		return loadRoot(identity)
	case nerd.GroupNode:
		return loadGroup(identity)
	case nerd.AuthenticatorNode:
		return loadAuthenticator(identity)
	case nerd.UserNode:
		return loadUser(identity)
	default:
		panic(fmt.Sprintf("unsupported node type: %d", identity.NodeType))
	}
}

func init() {
	// Register the switch-based loader
	node.LoadNodeFromIdentity = loadNodeFromIdentity
}
