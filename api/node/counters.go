package node

import (
	"sync/atomic"

	"github.com/gadfly16/nerd/api/nerd"
)

var (
	newIDCounter *int64 = new(int64)
)

func NewID() nerd.NodeID {
	// On the GUI side we use JS's number type to handle IDs
	if *newIDCounter >= 2<<53 {
		panic("ID counter exceeded allowed limit.")
	}
	return nerd.NodeID(atomic.AddInt64(newIDCounter, 1))
}

// InitIDCounter initializes the ID counter to the highest existing ID in database
func InitIDCounter() {
	var maxID int64
	result := DB.Raw("SELECT COALESCE(MAX(node_id), 0) FROM identities").Scan(&maxID)
	if result.Error != nil {
		// If query fails, start from 0 (empty database case)
		maxID = 0
	}
	atomic.StoreInt64(newIDCounter, maxID)
}

// ResetIDCounter resets the ID counter to 0 (for clean restart after shutdown)
func ResetIDCounter() {
	atomic.StoreInt64(newIDCounter, 0)
}
