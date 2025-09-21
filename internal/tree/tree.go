package tree

import (
	"sync"

	"github.com/gadfly16/nerd/internal/tree/nerd"
	"github.com/gadfly16/nerd/internal/tree/nodes"
)

// Tree manages the overall tree coordination and runtime
type Tree struct {
	nodes map[nerd.NodeID]*nerd.Tag
	mutex sync.RWMutex
}

// newTree creates a new Tree instance
func newTree() *Tree {
	return &Tree{
		nodes: make(map[nerd.NodeID]*nerd.Tag),
	}
}

// addTag adds a tag to the tree for routing (authoritative)
func (t *Tree) addTag(tag *nerd.Tag) {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	t.nodes[tag.NodeID] = tag
}

// removeNode removes a node from the tree (authoritative)
func (t *Tree) removeNode(nodeID nerd.NodeID) {
	t.mutex.Lock()
	defer t.mutex.Unlock()

	delete(t.nodes, nodeID)
}

// getTag returns the tag for a given node ID (thread-safe read)
func (t *Tree) getTag(nodeID nerd.NodeID) (*nerd.Tag, bool) {
	t.mutex.RLock()
	defer t.mutex.RUnlock()

	tag, exists := t.nodes[nodeID]
	return tag, exists
}

// isNodeAlive checks if a node exists in the tree (atomic read)
func (t *Tree) isNodeAlive(nodeID nerd.NodeID) bool {
	t.mutex.RLock()
	defer t.mutex.RUnlock()

	_, exists := t.nodes[nodeID]
	return exists
}

// getNodeCount returns the total number of active nodes (atomic read)
func (t *Tree) getNodeCount() int {
	t.mutex.RLock()
	defer t.mutex.RUnlock()

	return len(t.nodes)
}

// NotifyNode sends a message to a node (non-blocking)
func (t *Tree) NotifyNode(targetID nerd.NodeID, msgType nerd.MessageType, payload interface{}) error {
	tag, exists := t.getTag(targetID)
	if !exists {
		return nerd.ErrNodeNotFound
	}

	return tag.Notify(msgType, payload)
}

// AskNode sends a message to a node and waits for response (blocking)
func (t *Tree) AskNode(targetID nerd.NodeID, msgType nerd.MessageType, payload interface{}) (*nerd.Message, error) {
	tag, exists := t.getTag(targetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	return tag.Ask(msgType, payload)
}

// InitInstance initializes a new Nerd instance by setting up the database
// and bootstrapping the Root node using runtime infrastructure
func InitInstance(dbPath string) error {
	err := nodes.InitDatabase(dbPath)
	if err != nil {
		return err
	}

	// Bootstrap Root node using runtime infrastructure
	root := nodes.NewRoot(dbPath)
	err = root.Save()
	if err != nil {
		return err
	}

	// Start Root node briefly to establish the tree structure
	tree := newTree()
	tree.addTag(root.GetTag())
	root.Run()

	// TODO: Send messages to create initial children if needed
	// TODO: Graceful shutdown when initialization is complete

	return nil
}
