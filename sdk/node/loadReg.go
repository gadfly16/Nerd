package node

// LoadNodeFromEntity is set by the builtin package to provide node loading functionality
var LoadNodeFromEntity func(*Entity) (Node, error)
