package node

import (
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
)

// Deprecated: Use nerd.GroupNode instead
const Group = nerd.GroupNode

// Deprecated: Use nerd.RootNode instead
const Root = nerd.RootNode

// Deprecated: Use nerd.AuthenticatorNode instead
const Authenticator = nerd.AuthenticatorNode

// Deprecated: Use nerd.UserNode instead
const User = nerd.UserNode

// Deprecated: Use nerd.BuiltinNodeSeparator instead
const BuiltinSeparator = nerd.BUILTIN_NODE_SEPARATOR

// Deprecated: Use nerd.NodeTypeName instead
func NodeTypeName(nt nerd.NodeType) string {
	return nerd.NodeTypeName(nt)
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
