package tree

// Tag bundles information about a node for routing without direct pointers
type tag struct {
	NodeID   nodeID
	Incoming pipe
	// Owner info omitted for now (no authentication yet)
}

// Tree manages the in-memory tree structure for message routing
type tree struct {
	Nodes map[nodeID]*tag
}

// NewTree creates a new Tree instance
func newTree() *tree {
	return &tree{
		Nodes: make(map[nodeID]*tag),
	}
}

// AddNode adds a node tag to the tree for routing
func (t *tree) addNode(nodeID nodeID, pipe pipe) {
	t.Nodes[nodeID] = &tag{
		NodeID:   nodeID,
		Incoming: pipe,
	}
}

// RemoveNode removes a node from the tree
func (t *tree) removeNode(nodeID nodeID) {
	delete(t.Nodes, nodeID)
}

// GetTag returns the tag for a given node ID
func (t *tree) getTag(nodeID nodeID) (*tag, bool) {
	tag, exists := t.Nodes[nodeID]
	return tag, exists
}
