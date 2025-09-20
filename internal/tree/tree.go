package tree

import (
	"github.com/gadfly16/nerd/internal/tree/system"
)

// Tree manages the overall tree coordination and runtime
type Tree struct {
	system *system.System
}

// NewTree creates a new Tree instance with curated system access
func NewTree() *Tree {
	return &Tree{
		system: system.NewSystem(),
	}
}

// AddNode adds a node to the tree for routing
func (t *Tree) AddNode(nodeID system.NodeID, pipe system.Pipe) {
	t.system.AddNode(nodeID, pipe)
}

// RemoveNode removes a node from the tree
func (t *Tree) RemoveNode(nodeID system.NodeID) {
	t.system.RemoveNode(nodeID)
}

// GetSystem returns the curated system access layer
func (t *Tree) GetSystem() *system.System {
	return t.system
}
