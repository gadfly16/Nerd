package tree

import (
	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
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

	// Post-processing based on message type
	switch httpMsg.Type {
	case httpmsg.HttpCreateChild:
		// Register newly created node in tree
		addTag(result.(*msg.Tag))
	case httpmsg.HttpShutdown:
		// Remove all shutdown nodes from tree
		shutdownTags := result.([]*msg.Tag)
		for _, tag := range shutdownTags {
			tree.removeTag(tag.NodeID)
		}
		// If Root node was shut down, clean up global state for restart
		for _, tag := range shutdownTags {
			if tag.NodeID == 1 {
				node.ResetIDCounter()
				node.CloseDatabase()
				break
			}
		}
	}

	return result, nil
}
