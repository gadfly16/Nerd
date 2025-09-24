package api

import (
	"github.com/gadfly16/nerd/internal/msg"
	"github.com/gadfly16/nerd/internal/nerd"
)

// NotifyNode sends a message to a node (non-blocking)
func NotifyNode(targetID nerd.NodeID, msgType msg.MsgType, payload any) error {
	tag, exists := nerd.GetTag(targetID)
	if !exists {
		return nerd.ErrNodeNotFound
	}

	return tag.Notify(msgType, payload)
}

// AskNode sends a message to a node and waits for response (blocking)
func AskNode(targetID nerd.NodeID, msgType msg.MsgType, payload any) (any, error) {
	tag, exists := nerd.GetTag(targetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Prepare message struct
	m := &nerd.Msg{
		Type:    msgType,
		Payload: payload,
	}

	return tag.Ask(m)
}
