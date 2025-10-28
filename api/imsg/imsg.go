package imsg

import "github.com/gadfly16/nerd/api/nerd"

// Type defines the types of interface messages for external API
type Type int

type ITag struct {
	ID    nerd.NodeID `json:"id"`
	Admin bool        `json:"admin"`
}

const (
	GetTree Type = iota
	Lookup
	CreateChild
	RenameChild
	DeleteChild
	Shutdown

	AuthenticateUser
	Logout

	NodeSubscribe
	NodeUnsubscribe
	TopoUpdate
	NodeUpdate
	// Future interface message types can be added here
)

// IMsg represents a generic interface message with flexible payload
type IMsg struct {
	Type     Type           `json:"type"`
	TargetID nerd.NodeID    `json:"targetId"`
	UserID   nerd.NodeID    `json:"userId"` // Authentication context
	Payload  map[string]any `json:"payload"`
}
