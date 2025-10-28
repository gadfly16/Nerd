package node

import "github.com/gadfly16/nerd/sdk/msg"

// LoadBuiltinNodeFromEntity dispatches builtin node loading by type.
// Set by init() in internal/builtin/loadDispatch.go to builtin.loadNodeFromEntity()
var LoadBuiltinNodeFromEntity func(*Entity) (Node, error)

func RegisterLoadBuiltinNodeFromEntity(fn func(*Entity) (Node, error)) {
	if LoadBuiltinNodeFromEntity != nil {
		panic("LoadBuiltinNodeFromEntity already registered")
	}
	LoadBuiltinNodeFromEntity = fn
}

// SystemNodes holds references to system nodes for easy access
type SystemNodes struct {
	Authenticator *msg.Tag
	TopoUpdater   *msg.Tag
}

// System provides access to system node tags
var System = &SystemNodes{}
