package msg

import (
	"context"

	"github.com/coder/websocket"
	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
)

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

// Converts native tag to interface tag
func (t *Tag) ToITag() *imsg.ITag {
	return &imsg.ITag{
		ID:    t.NodeID,
		Admin: t.Admin,
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
	DeleteChild // delete child by ID
	GetTree     // get tree structure for GUI
	Lookup      // lookup node by path

	// Internal messages
	RenameSelf // Sent by RenameChild handler
	DeleteSelf // Sent by DeleteChild handler

	// Separator - messages >= this value are node-specific
	COMMON_MSG_SEPARATOR

	// Node-specific messages start here
	// Each node type can define their own starting from this point
	AuthenticateUser // Authenticator: authenticate user by username/password
	AuthenticateSelf // User: password verification

	// GUI-specific messages
	TopoSubscribe   // GUI: subscribe for topo updates on TopoUpdater
	TopoUnsubscribe // GUI: unsubscribe from TopoUpdater
	NodeSubscribe   // GUI: subscribe to node-specific updates
	NodeUnsubscribe // GUI: unsubscribe from node detail updates
	TopoUpdate      // GUI: topology changes reported
	NodeUpdate      // GUI: node details changes reported
)

// CreateChildPayload contains node type and optional name for creating a child node
type CreateChildPayload struct {
	NodeType nerd.NodeType // Will be nerd.NodeType, but avoiding circular import
	Name     string        // Empty string means auto-generate name
	Spec     any           // Node-specific initialization data
}

// CreateGUIPayload contains websocket connection and context for GUI
type CreateGUIPayload struct {
	Conn       *websocket.Conn
	Ctx        context.Context
	CancelFunc context.CancelFunc
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
