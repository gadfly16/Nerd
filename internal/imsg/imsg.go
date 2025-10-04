package imsg

import "github.com/gadfly16/nerd/api/nerd"

// Type defines the types of interface messages for external API
type Type int

const (
	GetTree Type = iota
	CreateChild
	RenameChild
	Shutdown
	AuthenticateUser
	CreateUser
	Logout
	// Future interface message types can be added here
)

// IMsg represents a generic interface message with flexible payload
type IMsg struct {
	Type     Type           `json:"type"`
	TargetID nerd.NodeID    `json:"targetId"`
	UserID   nerd.NodeID    `json:"userId"` // Authentication context
	Payload  map[string]any `json:"payload"`
}
