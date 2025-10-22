package tree

import (
	"sync"

	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/api/nerd"
)

var (
	tree nodeTree
)

// nodeTree manages the overall tree coordination and runtime
type nodeTree struct {
	nodes map[nerd.NodeID]*msg.Tag
	mutex sync.RWMutex
}

// initTree creates a new Tree instance
func initTree() {
	tree = nodeTree{
		nodes: make(map[nerd.NodeID]*msg.Tag),
	}
}

// addTag adds a tag to the tree for routing (authoritative)
func addTag(t *msg.Tag) {
	tree.mutex.Lock()
	defer tree.mutex.Unlock()

	tree.nodes[t.NodeID] = t
}

// removeNode removes a node from the tree (authoritative)
func (t *nodeTree) removeTag(nodeID nerd.NodeID) {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	delete(t.nodes, nodeID)
}

// getTag returns the tag for a given node ID (thread-safe read)
func getTag(nodeID nerd.NodeID) (*msg.Tag, bool) {
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
