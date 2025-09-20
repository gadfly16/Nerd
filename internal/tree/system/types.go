package system

// Fundamental types for the Nerd tree system

// NodeID uniquely identifies a node in the tree
type NodeID int64

// NodeType defines the different types of nodes
type NodeType int

const (
	GroupNode NodeType = iota
	RootNode
	UserNode
	UpdaterNode
	LoggerNode
	AuthenticatorNode
)

// MessageType defines the types of messages that can be sent
type MessageType int

const (
	CreateChildMessage MessageType = iota
	QueryMessage
	ShutdownMessage
)

// Pipe is a channel for sending messages to nodes
type Pipe chan *Message

// Message represents a message sent between nodes
type Message struct {
	Type    MessageType
	Payload interface{}
	Answer  Pipe // nil for Send mode, set for Ask mode
}

// Tag bundles information about a node for routing without direct pointers
type Tag struct {
	NodeID   NodeID
	Incoming Pipe
	// Owner info omitted for now (no authentication yet)
}
