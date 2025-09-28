package builtin

import "github.com/gadfly16/nerd/api/node"

func init() {
	// Register builtin node loaders
	node.RegisterNodeLoader(node.Root, func(identity *node.Identity) (node.Node, error) {
		return LoadRoot(identity)
	})

	node.RegisterNodeLoader(node.Group, func(identity *node.Identity) (node.Node, error) {
		return LoadGroup(identity)
	})
}
