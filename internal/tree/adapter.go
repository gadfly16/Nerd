package tree

import (
	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/builtin"
)

// INotify translates interface message to native message and sends it to target
func INotify(httpMsg imsg.IMsg) error {
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

// IAsk translates interface message to native message and waits for answer
func IAsk(httpMsg imsg.IMsg) (any, error) {
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
	case imsg.CreateChild:
		// Register newly created node in tree
		addTag(result.(*msg.Tag))
	case imsg.Shutdown:
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

// AskAuth routes authentication messages to the Authenticator node
func AskAuth(httpMsg imsg.IMsg) (any, error) {
	// Translate HTTP message to native message
	nativeMsg, err := builtin.TranslateHttpMessage(httpMsg)
	if err != nil {
		return nil, err
	}

	// Send to Authenticator node and get response
	result, err := builtin.System.Authenticator.Ask(nativeMsg)
	if err != nil {
		return nil, err
	}

	// Convert Tag to map for server
	tag := result.(*msg.Tag)

	// Post-processing based on message type
	switch httpMsg.Type {
	case imsg.CreateUser:
		// Register newly created user in tree
		addTag(tag)
	}

	return tag.ToMap(), nil
}
