package imsg

import "github.com/gadfly16/nerd/api/nerd"

// Type defines the types of interface messages for external API
type Type int

type ITag struct {
	ID    nerd.NodeID `json:"id"`
	Admin bool        `json:"admin"`
}

type INewNodePayload struct {
	ID    nerd.NodeID `json:"id"`
	Name  string      `json:"name"`
	Admin bool        `json:"admin"`
}

const (
	IGetTree Type = iota
	ILookup
	ICreateChild
	IRenameChild
	IDeleteChild
	IShutdown

	IAuthenticateUser
	ILogout

	INodeSubscribe
	INodeUnsubscribe
	ITopoUpdate
	INodeUpdate

	IGetState
	// Future interface message types can be added here
)

// IMsg represents a generic interface message with flexible payload
type IMsg struct {
	Type     Type           `json:"type"`
	TargetID nerd.NodeID    `json:"targetId"`
	UserID   nerd.NodeID    `json:"userId"` // Authentication context
	Payload  map[string]any `json:"payload"`
}
