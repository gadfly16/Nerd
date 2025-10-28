package node

// LoadBuiltinNodeFromEntity dispatches builtin node loading by type.
// Set by init() in internal/builtin/loadDispatch.go to builtin.loadNodeFromEntity()
var LoadBuiltinNodeFromEntity func(*Entity) (Node, error)

func RegisterLoadBuiltinNodeFromEntity(fn func(*Entity) (Node, error)) {
	if LoadBuiltinNodeFromEntity != nil {
		panic("LoadBuiltinNodeFromEntity already registered")
	}
	LoadBuiltinNodeFromEntity = fn
}
