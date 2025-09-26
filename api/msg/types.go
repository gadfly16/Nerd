package msg

import "github.com/gadfly16/nerd/api/nerd"

// Msg represents a message sent between nodes
type Msg struct {
	Type    MsgType
	Payload any
	APipe   AnswerChan // nil for Notify mode, set for Ask mode
}

// MsgType defines the types of messages that can be sent
type MsgType int

// Tag bundles information about a node for routing without direct pointers
type Tag struct {
	NodeID   nerd.NodeID `gorm:"primaryKey"`
	Incoming MsgChan     `gorm:"-"` // Runtime field, not persisted
	// Owner info omitted for now (no authentication yet)
}

// Answer represents a response with payload and error
type Answer struct {
	Payload any
	Error   error
}

// MsgChan is a channel for sending messages to nodes
type MsgChan chan Msg

// AnswerChan is a channel for sending answers back
type AnswerChan chan Answer

const (
	// Common messages (handled by Identity)
	CreateChild MsgType = iota
	Shutdown
	RenameChild
	InternalRename // internal operation only

	// Separator - messages >= this value are node-specific
	CommonMsgSeparator

	// Node-specific messages start here
	// Each node type can define their own starting from this point
)

// CreateChildPayload contains node type and optional name for creating a child node
type CreateChildPayload struct {
	NodeType int    // Will be nerd.NodeType, but avoiding circular import
	Name     string // Empty string means auto-generate name
}

// RenameChildPayload contains old and new names for renaming a child node
type RenameChildPayload struct {
	OldName string
	NewName string
}
