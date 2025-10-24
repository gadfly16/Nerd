package nerd

// NodeID uniquely identifies a node in the tree
type NodeID int64

// NodeType defines the different types of nodes
type NodeType int

// Built-in node types
const (
	GroupNode NodeType = iota
	RootNode
	AuthenticatorNode
	UserNode

	BUILTIN_NODE_SEPARATOR
)

// NodeTypeName returns the string representation of a NodeType
func NodeTypeName(nt NodeType) string {
	switch nt {
	case GroupNode:
		return "Group"
	case RootNode:
		return "Root"
	case AuthenticatorNode:
		return "Authenticator"
	case UserNode:
		return "User"
	default:
		return "Unknown"
	}
}
