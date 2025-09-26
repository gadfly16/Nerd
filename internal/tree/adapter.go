package tree

import (
	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
)

// NotifyNode sends a message to a node (non-blocking)
func NotifyNode(targetID nerd.NodeID, msgType msg.MsgType, payload any) error {
	tag, exists := getTag(targetID)
	if !exists {
		return nerd.ErrNodeNotFound
	}

	tag.Notify(msgType, payload)

	return nil
}

// AskNode sends a message to a node and waits for response (blocking)
func AskNode(targetID nerd.NodeID, msgType msg.MsgType, payload any) (any, error) {
	tag, exists := getTag(targetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Prepare message struct
	m := &msg.Msg{
		Type:    msgType,
		Payload: payload,
	}

	return tag.Ask(m)
}
