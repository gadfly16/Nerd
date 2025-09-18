package instance

// Tag bundles information about a node for routing without direct pointers
type Tag struct {
	NodeID   NodeID
	Incoming Pipe
	// Owner info omitted for now (no authentication yet)
}

// Tree manages the in-memory tree structure for message routing
type Tree struct {
	Nodes map[NodeID]*Tag
}

// NewTree creates a new Tree instance
func NewTree() *Tree {
	return &Tree{
		Nodes: make(map[NodeID]*Tag),
	}
}

// AddNode adds a node tag to the tree for routing
func (t *Tree) AddNode(nodeID NodeID, pipe Pipe) {
	t.Nodes[nodeID] = &Tag{
		NodeID:   nodeID,
		Incoming: pipe,
	}
}

// RemoveNode removes a node from the tree
func (t *Tree) RemoveNode(nodeID NodeID) {
	delete(t.Nodes, nodeID)
}

// GetTag returns the tag for a given node ID
func (t *Tree) GetTag(nodeID NodeID) (*Tag, bool) {
	tag, exists := t.Nodes[nodeID]
	return tag, exists
}
