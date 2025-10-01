package tree

import (
	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/builtin"
	"github.com/gadfly16/nerd/internal/httpmsg"
)

// NotifyNode translates HTTP message to native message and sends non-blocking
func NotifyNode(httpMsg httpmsg.HttpMsg) error {
	// Validate target exists
	tag, exists := getTag(httpMsg.TargetID)
	if !exists {
		return nerd.ErrNodeNotFound
	}

	// Translate HTTP message to native message
	nativeMsg, err := builtin.TranslateHttpMessage(httpMsg)
	if err != nil {
		return err
	}

	// Send to target node
	tag.Notify(nativeMsg)
	return nil
}

// AskNode translates HTTP message to native message and sends blocking
func AskNode(httpMsg httpmsg.HttpMsg) (any, error) {
	// Validate target exists
	tag, exists := getTag(httpMsg.TargetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Translate HTTP message to native message
	nativeMsg, err := builtin.TranslateHttpMessage(httpMsg)
	if err != nil {
		return nil, err
	}

	// Send to target node and get response
	result, err := tag.Ask(nativeMsg)
	if err != nil {
		return nil, err
	}

	// Post-processing: if this was CreateChild, register the new node in tree
	if httpMsg.Type == httpmsg.HttpCreateChild {
		addTag(result.(*msg.Tag))
	}

	return result, nil
}
