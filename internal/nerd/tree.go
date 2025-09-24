package nerd

import (
	"sync"
	"sync/atomic"
)

var (
	tree         nodeTree
	newIDCounter *int64 = new(int64)
)

// nodeTree manages the overall tree coordination and runtime
type nodeTree struct {
	nodes map[NodeID]*Tag
	mutex sync.RWMutex
}

func NewID() NodeID {
	// On the GUI side we use JS's number type to handle IDs
	if *newIDCounter >= 2<<53 {
		panic("ID counter exceeded allowed limit.")
	}
	return NodeID(atomic.AddInt64(newIDCounter, 1))
}

// initTree creates a new Tree instance
func InitTree() {
	tree = nodeTree{
		nodes: make(map[NodeID]*Tag),
	}
}

// addTag adds a tag to the tree for routing (authoritative)
func AddTag(tag *Tag) {
	tree.mutex.Lock()
	defer tree.mutex.Unlock()

	tree.nodes[tag.NodeID] = tag
}

// removeNode removes a node from the tree (authoritative)
func (t *nodeTree) removeTag(nodeID NodeID) {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	delete(t.nodes, nodeID)
}

// getTag returns the tag for a given node ID (thread-safe read)
func GetTag(nodeID NodeID) (*Tag, bool) {
	tree.mutex.RLock()
	defer tree.mutex.RUnlock()

	tag, exists := tree.nodes[nodeID]
	return tag, exists
}

// getNodeCount returns the total number of active nodes (atomic read)
func GetNodeCount() int {
	tree.mutex.RLock()
	defer tree.mutex.RUnlock()

	return len(tree.nodes)
}
