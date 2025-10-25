package node

import (
	"sync/atomic"

	"github.com/gadfly16/nerd/api/nerd"
)

var (
	persistentIDCounter *int64 = new(int64)
	runtimeIDCounter    *int64 = new(int64)
)

func NewPersistentID() nerd.NodeID {
	// On the GUI side we use JS's number type to handle IDs
	if *persistentIDCounter >= 2<<53 {
		panic("persistent ID counter exceeded allowed limit.")
	}
	return nerd.NodeID(atomic.AddInt64(persistentIDCounter, 1))
}

// NewRuntimeID generates negative IDs for ephemeral nodes (GUI nodes, etc.)
// These IDs reset on instance restart and nodes are not persisted to database
func NewRuntimeID() nerd.NodeID {
	if *persistentIDCounter <= -2<<53 {
		panic("runtime ID counter exceeded allowed limit.")
	}
	return nerd.NodeID(atomic.AddInt64(runtimeIDCounter, -1))
}

// InitPersistentIDCounter initializes the ID counter to the highest existing ID in database
func InitPersistentIDCounter() {
	var maxID int64
	result := DB.Raw("SELECT COALESCE(MAX(node_id), 0) FROM entities").Scan(&maxID)
	if result.Error != nil {
		// If query fails, start from 0 (empty database case)
		maxID = 0
	}
	atomic.StoreInt64(persistentIDCounter, maxID)
}

// ResetPersistentIDCounter resets the ID counter to 0 (for clean restart after shutdown)
func ResetPersistentIDCounter() {
	atomic.StoreInt64(persistentIDCounter, 0)
}
