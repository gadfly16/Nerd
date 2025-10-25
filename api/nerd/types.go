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
	GUINode

	BUILTIN_NODE_SEPARATOR
)

// NodeTypeInfo contains metadata about a node type
type NodeTypeInfo struct {
	Name            string
	AllowedChildren []NodeType
	Ephemeral       bool
}

// Info returns metadata for a NodeType
func (nt NodeType) Info() NodeTypeInfo {
	switch nt {
	case RootNode:
		return NodeTypeInfo{
			Name:            "Root",
			AllowedChildren: []NodeType{AuthenticatorNode, GroupNode},
			Ephemeral:       false,
		}
	case AuthenticatorNode:
		return NodeTypeInfo{
			Name:            "Authenticator",
			AllowedChildren: []NodeType{UserNode},
			Ephemeral:       false,
		}
	case UserNode:
		return NodeTypeInfo{
			Name:            "User",
			AllowedChildren: []NodeType{GroupNode},
			Ephemeral:       false,
		}
	case GroupNode:
		return NodeTypeInfo{
			Name:            "Group",
			AllowedChildren: []NodeType{GroupNode, GUINode},
			Ephemeral:       false,
		}
	case GUINode:
		return NodeTypeInfo{
			Name:            "GUI",
			AllowedChildren: []NodeType{},
			Ephemeral:       true,
		}
	default:
		return NodeTypeInfo{
			Name:            "Unknown",
			AllowedChildren: []NodeType{},
			Ephemeral:       false,
		}
	}
}
