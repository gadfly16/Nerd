package tree

import (
	"strings"

	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// IAsk translates interface message to native message and waits for answer
func IAsk(im imsg.IMsg) (any, error) {
	// Get sender tag from registry
	sender, exists := registry.get(im.UserID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Special case: targetId 0 for RenameChild and DeleteChild means user operating on themselves
	// Redirect to Authenticator (parent of user nodes)
	var tag *msg.Tag
	if im.TargetID == 0 && (im.Type == imsg.IRenameChild || im.Type == imsg.IDeleteChild) {
		tag = node.System.Authenticator
	} else {
		// Validate target exists
		var exists bool
		tag, exists = registry.get(im.TargetID)
		if !exists {
			return nil, nerd.ErrNodeNotFound
		}
	}

	switch im.Type {
	case imsg.IGetTree:
		return handleIGetTree(sender, tag)
	case imsg.ILookup:
		return handleILookup(sender, tag, im)
	case imsg.IRenameChild:
		return handleIRenameChild(sender, tag, im)
	case imsg.ICreateChild:
		return handleICreateChild(sender, tag, im)
	case imsg.IDeleteChild:
		return handleIDeleteChild(sender, tag, im)
	case imsg.IShutdown:
		return handleIShutdown(sender, tag)
	case imsg.IGetState:
		return handleIGetState(sender, tag)
	default:
		return nil, nerd.ErrMalformedIMsg
	}
}

// IAskAuth routes authentication messages to the Authenticator node
// For auth messages, sender is Root (Authenticator's owner) which is admin
func IAskAuth(im imsg.IMsg) (ia any, err error) {
	tag := node.System.Authenticator
	sender := node.System.Authenticator.Owner // Root is admin

	switch im.Type {
	case imsg.IAuthenticateUser:
		return handleIAuthenticateUser(sender, im)
	case imsg.ICreateChild:
		return handleICreateChild(sender, tag, im)
	default:
		return nil, nerd.ErrMalformedIMsg
	}
}

// handleIGetTree converts HttpGetTree message to native GetTree message
func handleIGetTree(sender *msg.Tag, receiver *msg.Tag) (any, error) {
	return sender.Ask(receiver, &msg.Msg{
		Type: msg.GetTree,
	})
}

// handleILookup converts HttpLookup message to native Lookup message
func handleILookup(sender *msg.Tag, receiver *msg.Tag, im imsg.IMsg) (ia any, err error) {
	pathStr, ok := im.Payload["path"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	// Split path by "/" to create path segments
	var path msg.LookupPayload
	if pathStr != "" {
		path = strings.Split(pathStr, "/")
	}

	a, err := sender.Ask(receiver, &msg.Msg{
		Type:    msg.Lookup,
		Payload: path,
	})
	if err != nil {
		return nil, err
	}
	return a.(*msg.Tag).ToITag(), nil
}

// handleIRenameChild converts HttpRenameChild message to native RenameChild message
func handleIRenameChild(sender *msg.Tag, receiver *msg.Tag, im imsg.IMsg) (any, error) {
	// Validate payload contains oldName field
	oldName, ok := im.Payload["oldName"]
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	oldNameStr, ok := oldName.(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	// Validate payload contains newName field
	newName, ok := im.Payload["newName"]
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	newNameStr, ok := newName.(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	return sender.Ask(receiver, &msg.Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: oldNameStr,
			NewName: newNameStr,
		},
	})
}

// handleICreateChild converts HttpCreateChild message to native CreateChild message
func handleICreateChild(sender *msg.Tag, receiver *msg.Tag, im imsg.IMsg) (ia any, err error) {
	nodeType, ok := im.Payload["nodeType"]
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	nodeTypeFloat, ok := nodeType.(float64)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	// Get name field, create default name if empty
	name := ""
	if nameVal, exists := im.Payload["name"]; exists {
		nameStr, ok := nameVal.(string)
		if !ok {
			return nil, nerd.ErrMalformedIMsg
		}
		name = nameStr
	}

	payload, err := sender.AskCreateChild(receiver, nerd.NodeType(nodeTypeFloat), name, im.Payload["spec"])
	if err != nil {
		return nil, err
	}

	return &imsg.INewNodePayload{
		ID:    payload.NodeID,
		Name:  payload.Name,
		Admin: payload.Admin,
	}, nil
}

// handleIDeleteChild converts HttpDeleteChild message to native DeleteChild message
func handleIDeleteChild(sender *msg.Tag, receiver *msg.Tag, im imsg.IMsg) (any, error) {
	childName, ok := im.Payload["childName"]
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	childNameStr, ok := childName.(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	return nil, sender.AskDeleteChild(receiver, childNameStr)
}

// handleIShutdown converts HttpShutdown message to native Shutdown message
func handleIShutdown(sender *msg.Tag, receiver *msg.Tag) (ia any, err error) {
	a, err := sender.Ask(receiver, &msg.Msg{Type: msg.Shutdown})
	shutdownTag := a.(*msg.Tag)

	// If Root node was shut down, clean up global state for restart
	if shutdownTag.NodeID == 1 {
		node.ResetPersistentIDCounter()
		node.CloseDatabase()
	}
	return nil, nil
}

// handleIAuthenticateUser converts HttpAuthenticateUser to native AuthenticateUser message
func handleIAuthenticateUser(sender *msg.Tag, im imsg.IMsg) (ia any, err error) {
	// Extract username and password from payload
	username, ok := im.Payload["username"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	password, ok := im.Payload["password"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	a, err := sender.Ask(node.System.Authenticator, &msg.Msg{
		Type: msg.AuthenticateUser,
		Payload: msg.CredentialsPayload{
			Username: username,
			Password: password,
		},
	})
	if err != nil {
		return nil, err
	}
	return a.(*msg.Tag).ToITag(), nil
}

// handleICreateUser converts HttpCreateUser to native CreateUser message
func handleICreateUser(sender *msg.Tag, im imsg.IMsg) (ia any, err error) {
	username, ok := im.Payload["username"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	password, ok := im.Payload["password"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	// Create user via CreateChild message (goes through topology handler)
	a, err := sender.Ask(node.System.Authenticator, &msg.Msg{
		Type: msg.CreateChild,
		Payload: msg.CreateChildPayload{
			NodeType: nerd.UserNode,
			Name:     username,
			Spec: msg.CredentialsPayload{
				Username: username,
				Password: password,
			},
		},
	})
	if err != nil {
		return nil, err
	}
	return a.(*msg.Tag).ToITag(), nil
}

// handleIGetState requests state values from a node
func handleIGetState(sender *msg.Tag, receiver *msg.Tag) (any, error) {
	a, err := sender.Ask(receiver, &msg.Msg{Type: msg.GetState})
	if err != nil {
		return nil, err
	}

	// Return the state values as-is (should be [][]any from the node)
	return a, nil
}
