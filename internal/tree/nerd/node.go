package nerd

// Node interface defines common methods all node types must implement
type Node interface {
	GetID() NodeID
	GetName() string
	GetNodeType() NodeType
	GetIncoming() Pipe
	Run()
	Save() error
	Load() error
	Shutdown()
}

// NodeID uniquely identifies a node in the tree
type NodeID int64

// NodeType defines the different types of nodes
type NodeType int

const (
	GroupNode NodeType = iota
	RootNode
)

// Tag bundles information about a node for routing without direct pointers
type Tag struct {
	NodeID   NodeID
	Incoming Pipe
	// Owner info omitted for now (no authentication yet)
}
