package system

import (
	"errors"
	"sync"
)

// System provides curated, thread-safe access to runtime tree data
type System struct {
	nodes map[NodeID]*Tag
	mutex sync.RWMutex
}

// Message passing errors
var (
	// ErrNodeNotFound is returned when trying to access a non-existent node
	ErrNodeNotFound = errors.New("node not found in tree")

	// ErrNodeBusy is returned when a node's incoming pipe is full (non-blocking send failed)
	ErrNodeBusy = errors.New("node is busy (pipe full)")
)

// NewSystem creates a new System instance
func NewSystem() *System {
	return &System{
		nodes: make(map[NodeID]*Tag),
	}
}

// AddNode adds a node tag to the system for routing (thread-safe)
func (s *System) AddNode(nodeID NodeID, pipe Pipe) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	s.nodes[nodeID] = &Tag{
		NodeID:   nodeID,
		Incoming: pipe,
	}
}

// RemoveNode removes a node from the system (thread-safe)
func (s *System) RemoveNode(nodeID NodeID) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	delete(s.nodes, nodeID)
}

// GetTag returns the tag for a given node ID (thread-safe read)
func (s *System) GetTag(nodeID NodeID) (*Tag, bool) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	tag, exists := s.nodes[nodeID]
	return tag, exists
}

// IsNodeAlive checks if a node exists in the system (atomic read)
func (s *System) IsNodeAlive(nodeID NodeID) bool {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	_, exists := s.nodes[nodeID]
	return exists
}

// GetNodeCount returns the total number of active nodes (atomic read)
func (s *System) GetNodeCount() int {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return len(s.nodes)
}
