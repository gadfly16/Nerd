package node

import (
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/api/nerd"
)

const (
	Group nerd.NodeType = iota
	Root
	Authenticator
	User
	BuiltinSeparator
)

// NodeTypeName returns the string representation of a NodeType
func NodeTypeName(nt nerd.NodeType) string {
	switch nt {
	case Group:
		return "Group"
	case Root:
		return "Root"
	case Authenticator:
		return "Authenticator"
	case User:
		return "User"
	default:
		return "Unknown"
	}
}

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
	Load() ([]*msg.Tag, error)
	Shutdown()
}
