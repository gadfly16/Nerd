package node

// LoadNodeFromIdentity is set by the builtin package to provide node loading functionality
var LoadNodeFromIdentity func(*Identity) (Node, error)
