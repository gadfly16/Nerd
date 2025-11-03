package node

import (
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
)

// Node interface defines common methods all node types must implement
type Node interface {
	GetEntity() *Entity
	GetTag() *msg.Tag
	GetID() nerd.NodeID
	GetName() string
	SetName(name string)
	GetNodeTypeName() string
	SetParentID(parentID nerd.NodeID)
	Run()
	Save() error
	// Load() ([]*msg.Tag, error)
	Shutdown()
	GetState([]msg.ValuePair) []msg.ValuePair
}
