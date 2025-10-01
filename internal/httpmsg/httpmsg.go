package httpmsg

import "github.com/gadfly16/nerd/api/nerd"

// HttpMsgType defines the types of HTTP messages for external API
type HttpMsgType int

const (
	HttpGetTree HttpMsgType = iota
	HttpCreateChild
	HttpRenameChild
	HttpShutdown
	// Future HTTP message types can be added here
)

// HttpMsg represents a generic HTTP message with flexible payload
type HttpMsg struct {
	Type     HttpMsgType    `json:"type"`
	TargetID nerd.NodeID    `json:"targetId"`
	UserID   nerd.NodeID    `json:"userId"` // Authentication context
	Payload  map[string]any `json:"payload"`
}
