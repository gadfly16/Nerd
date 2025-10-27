package tree

import (
	"sync"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
)

var (
	registry tagRegistry
)

func init() {
	registry = tagRegistry{nodes: make(map[nerd.NodeID]*msg.Tag)}
}

// tagRegistry manages the overall tree coordination and runtime
type tagRegistry struct {
	nodes map[nerd.NodeID]*msg.Tag
	mutex sync.RWMutex
}

// register adds a tag to the tree for routing (package-private)
func (reg *tagRegistry) add(t *msg.Tag) {
	registry.mutex.Lock()
	defer registry.mutex.Unlock()

	registry.nodes[t.NodeID] = t
}

// unregister removes a node from the reg (package-private)
func (reg *tagRegistry) remove(t *msg.Tag) {
	registry.mutex.Lock()
	defer registry.mutex.Unlock()

	delete(registry.nodes, t.NodeID)
}

// regGet returns the tag for a given node ID (package-private)
func (reg *tagRegistry) get(nodeID nerd.NodeID) (*msg.Tag, bool) {
	registry.mutex.RLock()
	defer registry.mutex.RUnlock()

	tag, exists := registry.nodes[nodeID]
	return tag, exists
}

// regCount returns the total number of active nodes (package-private)
func RegCount() int {
	registry.mutex.RLock()
	defer registry.mutex.RUnlock()

	return len(registry.nodes)
}
