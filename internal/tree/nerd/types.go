package nerd

// Fundamental types for the Nerd tree system

// NodeID uniquely identifies a node in the tree
type NodeID int64

// NodeType defines the different types of nodes
type NodeType int

const (
	GroupNode NodeType = iota
	RootNode
)

// Pipe is a channel for sending messages to nodes
type Pipe chan interface{}

// Tag bundles information about a node for routing without direct pointers
type Tag struct {
	NodeID   NodeID
	Incoming Pipe
	// Owner info omitted for now (no authentication yet)
}

// MessageType defines the types of messages that can be sent
type MessageType int

const (
	CreateChildMessage MessageType = iota
	QueryMessage
	ShutdownMessage
)

// Message represents a message sent between nodes
type Message struct {
	Type    MessageType
	Payload interface{}
	Answer  Pipe // nil for Notify mode, set for Ask mode
}

// Node interface defines common methods all node types must implement
type Node interface {
	GetID() NodeID
	GetName() string
	GetNodeType() NodeType
	GetIncoming() Pipe
	Run()
	Load(dbPath string) error
	Shutdown()
}
