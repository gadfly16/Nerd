package node

import (
	"github.com/gadfly16/nerd/api/nerd"
)

// NodeLoader is a function type that creates a node from an existing Identity
type NodeLoader func(*Identity) (Node, error)

// nodeLoaders holds the registry of node creation functions
var nodeLoaders = make(map[nerd.NodeType]NodeLoader)

// RegisterNodeLoader registers a loader function for a specific node type
// This allows both builtin and SDK nodes to register their loading logic
func RegisterNodeLoader(nodeType nerd.NodeType, loader NodeLoader) {
	nodeLoaders[nodeType] = loader
}
