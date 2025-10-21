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
	Admin    bool        // True if this node represents an admin user
}

// ToMap converts Tag to map[string]any for HTTP responses
func (t *Tag) ToMap() map[string]any {
	return map[string]any{
		"nodeId": float64(t.NodeID),
		"admin":  t.Admin,
	}
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
	// Common messages (handled by Entity)
	CreateChild MsgType = iota
	Shutdown
	RenameChild
	Rename  // internal operation only
	GetTree // get tree structure for GUI
	Lookup  // lookup node by path

	// Separator - messages >= this value are node-specific
	CommonMsgSeparator

	// Node-specific messages start here
	// Each node type can define their own starting from this point
	AuthenticateUser // Authenticator: authenticate user by username/password
	Authenticate     // User: password verification
	CreateUser       // Authenticator: create new user
)

// CreateChildPayload contains node type and optional name for creating a child node
type CreateChildPayload struct {
	NodeType nerd.NodeType // Will be nerd.NodeType, but avoiding circular import
	Name     string        // Empty string means auto-generate name
}

// RenameChildPayload contains old and new names for renaming a child node
type RenameChildPayload struct {
	OldName string
	NewName string
}

// TreeEntry represents a node and its children in the tree structure
type TreeEntry struct {
	NodeID   nerd.NodeID   `json:"nodeId"`
	Name     string        `json:"name"`
	NodeType nerd.NodeType `json:"nodeType"`
	Children []*TreeEntry  `json:"children"`
}

// CredentialsPayload contains username and password for authentication and user creation
type CredentialsPayload struct {
	Username string
	Password string
}

// LookupPayload contains path segments for node lookup
type LookupPayload []string
