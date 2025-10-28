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
	TopoUpdaterNode

	BUILTIN_NODE_SEPARATOR
)

// NodeTypeInfo contains metadata about a node type
type NodeTypeInfo struct {
	Name            string
	AllowedChildren []NodeType
	Runtime         bool
}

// Info returns metadata for a NodeType
func (nt NodeType) Info() NodeTypeInfo {
	switch nt {
	case RootNode:
		return NodeTypeInfo{
			Name:            "Root",
			AllowedChildren: []NodeType{AuthenticatorNode, GroupNode},
			Runtime:         false,
		}
	case AuthenticatorNode:
		return NodeTypeInfo{
			Name:            "Authenticator",
			AllowedChildren: []NodeType{UserNode},
			Runtime:         false,
		}
	case UserNode:
		return NodeTypeInfo{
			Name:            "User",
			AllowedChildren: []NodeType{GroupNode},
			Runtime:         false,
		}
	case GroupNode:
		return NodeTypeInfo{
			Name:            "Group",
			AllowedChildren: []NodeType{GroupNode, GUINode, TopoUpdaterNode},
			Runtime:         false,
		}
	case GUINode:
		return NodeTypeInfo{
			Name:            "GUI",
			AllowedChildren: []NodeType{},
			Runtime:         true,
		}
	case TopoUpdaterNode:
		return NodeTypeInfo{
			Name:            "TopoUpdater",
			AllowedChildren: []NodeType{},
			Runtime:         true,
		}
	default:
		return NodeTypeInfo{
			Name:            "Unknown",
			AllowedChildren: []NodeType{},
			Runtime:         false,
		}
	}
}
