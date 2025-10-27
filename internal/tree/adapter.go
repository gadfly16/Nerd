package tree

import (
	"strings"

	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/builtin"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// IAsk translates interface message to native message and waits for answer
func IAsk(im imsg.IMsg) (any, error) {
	// Validate target exists
	tag, exists := registry.get(im.TargetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	switch im.Type {
	case imsg.GetTree:
		return handleIGetTree(tag)
	case imsg.Lookup:
		return handleILookup(tag, im)
	case imsg.RenameChild:
		return handleIRenameChild(tag, im)
	case imsg.CreateChild:
		return handleICreateChild(tag, im)
	case imsg.DeleteChild:
		return handleIDeleteChild(tag, im)
	case imsg.Shutdown:
		return handleIShutdown(tag)
	default:
		return nil, nerd.ErrMalformedIMsg
	}
}

// IAskAuth routes authentication messages to the Authenticator node
func IAskAuth(im imsg.IMsg) (ia any, err error) {
	tag := builtin.System.Authenticator

	switch im.Type {
	case imsg.AuthenticateUser:
		return handleIAuthenticateUser(im)
	case imsg.CreateChild:
		return handleICreateChild(tag, im)
	default:
		return nil, nerd.ErrMalformedIMsg
	}
}

// handleIGetTree converts HttpGetTree message to native GetTree message
func handleIGetTree(t *msg.Tag) (any, error) {
	return t.Ask(&msg.Msg{
		Type: msg.GetTree,
	})
}

// handleILookup converts HttpLookup message to native Lookup message
func handleILookup(t *msg.Tag, im imsg.IMsg) (ia any, err error) {
	pathStr, ok := im.Payload["path"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	// Split path by "/" to create path segments
	var path msg.LookupPayload
	if pathStr != "" {
		path = strings.Split(pathStr, "/")
	}

	a, err := t.Ask(&msg.Msg{
		Type:    msg.Lookup,
		Payload: path,
	})
	if err != nil {
		return nil, err
	}
	return a.(*msg.Tag).ToITag(), nil
}

// handleIRenameChild converts HttpRenameChild message to native RenameChild message
func handleIRenameChild(t *msg.Tag, im imsg.IMsg) (any, error) {
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

	return t.Ask(&msg.Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: oldNameStr,
			NewName: newNameStr,
		},
	})
}

// handleICreateChild converts HttpCreateChild message to native CreateChild message
func handleICreateChild(t *msg.Tag, im imsg.IMsg) (ia any, err error) {
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

	a, err := t.Ask(&msg.Msg{
		Type: msg.CreateChild,
		Payload: msg.CreateChildPayload{
			NodeType: nerd.NodeType(nodeTypeFloat),
			Name:     name,
			Spec:     im.Payload["spec"], // nil if not provided
		},
	})
	if err != nil {
		return nil, err
	}

	return a.(*msg.Tag).ToITag(), nil
}

// handleIDeleteChild converts HttpDeleteChild message to native DeleteChild message
func handleIDeleteChild(t *msg.Tag, im imsg.IMsg) (any, error) {
	childID, ok := im.Payload["childId"]
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	childIDFloat, ok := childID.(float64)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	_, err := t.Ask(&msg.Msg{
		Type:    msg.DeleteChild,
		Payload: nerd.NodeID(childIDFloat),
	})
	return nil, err
}

// handleIShutdown converts HttpShutdown message to native Shutdown message
func handleIShutdown(t *msg.Tag) (ia any, err error) {
	a, err := t.Ask(&msg.Msg{Type: msg.Shutdown})
	shutdownTag := a.(*msg.Tag)

	// If Root node was shut down, clean up global state for restart
	if shutdownTag.NodeID == 1 {
		node.ResetPersistentIDCounter()
		node.CloseDatabase()
	}
	return nil, nil
}

// handleIAuthenticateUser converts HttpAuthenticateUser to native AuthenticateUser message
func handleIAuthenticateUser(im imsg.IMsg) (ia any, err error) {
	// Extract username and password from payload
	username, ok := im.Payload["username"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	password, ok := im.Payload["password"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	a, err := builtin.System.Authenticator.Ask(&msg.Msg{
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
func handleICreateUser(im imsg.IMsg) (ia any, err error) {
	username, ok := im.Payload["username"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	password, ok := im.Payload["password"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	// Create user via CreateChild message (goes through topology handler)
	a, err := builtin.System.Authenticator.Ask(&msg.Msg{
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
