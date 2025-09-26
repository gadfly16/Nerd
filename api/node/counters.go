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
