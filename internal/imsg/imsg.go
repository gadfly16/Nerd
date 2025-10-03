package imsg

import "github.com/gadfly16/nerd/api/nerd"

// HttpMsgType defines the types of interface messages for external API
type HttpMsgType int

const (
	HttpGetTree HttpMsgType = iota
	HttpCreateChild
	HttpRenameChild
	HttpShutdown
	HttpAuthenticateUser
	HttpCreateUser
	// Future interface message types can be added here
)

// IMsg represents a generic interface message with flexible payload
type IMsg struct {
	Type     HttpMsgType    `json:"type"`
	TargetID nerd.NodeID    `json:"targetId"`
	UserID   nerd.NodeID    `json:"userId"` // Authentication context
	Payload  map[string]any `json:"payload"`
}
