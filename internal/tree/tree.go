package tree

import (
	"sync"

	"github.com/gadfly16/nerd/internal/tree/nerd"
	"github.com/gadfly16/nerd/internal/tree/nodes"
)

var tree Tree

// Tree manages the overall tree coordination and runtime
type Tree struct {
	nodes map[nerd.NodeID]*nerd.Tag
	mutex sync.RWMutex
}

// initTree creates a new Tree instance
func initTree() {
	tree = Tree{
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
func (t *Tree) NotifyNode(targetID nerd.NodeID, msgType nerd.MsgType, payload any) error {
	tag, exists := t.getTag(targetID)
	if !exists {
		return nerd.ErrNodeNotFound
	}

	return tag.Notify(msgType, payload)
}

// AskNode sends a message to a node and waits for response (blocking)
func (t *Tree) AskNode(targetID nerd.NodeID, msgType nerd.MsgType, payload any) (any, error) {
	tag, exists := t.getTag(targetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Prepare message struct
	m := &nerd.Msg{
		Type:    msgType,
		Payload: payload,
	}

	return tag.Ask(m)
}

// InitInstance initializes a new Nerd instance by setting up the database
// and bootstrapping the Root node using runtime infrastructure
func InitInstance(dbPath string) error {
	err := nodes.InitDatabase(dbPath)
	if err != nil {
		return err
	}

	// Bootstrap Root node using runtime infrastructure
	rootNode := nodes.NewRoot(dbPath)
	err = rootNode.Save()
	if err != nil {
		return err
	}
	rootNode.Run()
	root := rootNode.GetTag()

	// Start Root node briefly to establish the tree structure
	initTree()
	tree.addTag(root)

	a, err := root.Ask(&nerd.Msg{
		Type:    nerd.Create_Child_Msg,
		Payload: nerd.GroupNode,
	})
	if err != nil {
		return err
	}

	// TODO: Process response and add child to tree
	_ = a // Silence unused variable for now

	// TODO: Graceful shutdown when initialization is complete

	return nil
}
