package msg

import (
	"sync"

	"github.com/gadfly16/nerd/api/nerd"
)

var (
	reg registry
)

// initTree creates a new Tree instance
func init() {
	reg = registry{
		nodes: make(map[nerd.NodeID]*Tag),
	}
}

// nodeTree manages the overall tree coordination and runtime
type registry struct {
	nodes map[nerd.NodeID]*Tag
	mutex sync.RWMutex
}

// addTag adds a tag to the tree for routing (authoritative)
func (t *Tag) Register() {
	reg.mutex.Lock()
	defer reg.mutex.Unlock()

	reg.nodes[t.NodeID] = t
}

// removeNode removes a node from the reg (authoritative)
func (t *Tag) Unregister() {
	reg.mutex.Lock()
	defer reg.mutex.Unlock()

	delete(reg.nodes, t.NodeID)
}

// getTag returns the tag for a given node ID (thread-safe read)
func RegGet(nodeID nerd.NodeID) (*Tag, bool) {
	reg.mutex.RLock()
	defer reg.mutex.RUnlock()

	tag, exists := reg.nodes[nodeID]
	return tag, exists
}

// getNodeCount returns the total number of active nodes (atomic read)
func RegCount() int {
	reg.mutex.RLock()
	defer reg.mutex.RUnlock()

	return len(reg.nodes)
}
