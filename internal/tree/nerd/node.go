package nerd

// Node interface defines common methods all node types must implement
type Node interface {
	GetTag() *Tag
	GetID() NodeID
	GetName() string
	SetName(name string)
	GetNodeTypeName() string
	SetParentID(parentID NodeID)
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
	NodeID   NodeID `gorm:"primaryKey"`
	Incoming Pipe   `gorm:"-"` // Runtime field, not persisted
	// Owner info omitted for now (no authentication yet)
}
