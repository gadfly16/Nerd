package tree

import (
	"strings"

	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/builtin"
	"github.com/gadfly16/nerd/sdk/msg"
)

// IAsk translates interface message to native message and waits for answer
func IAsk(im imsg.IMsg) (any, error) {
	// Validate target exists
	tag, exists := getTag(im.TargetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	switch im.Type {
	case imsg.GetTree:
		return HandleIGetTree(tag)
	case imsg.Lookup:
		return HandleILookup(tag, im)
	case imsg.RenameChild:
		return HandleIRenameChild(tag, im)
	case imsg.CreateChild:
		return HandleICreateChild(tag, im)
	case imsg.Shutdown:
		return HandleIShutdown(tag)
	default:
		return nil, nerd.ErrMalformedIMsg
	}
}

// IAskAuth routes authentication messages to the Authenticator node
func IAskAuth(im imsg.IMsg) (ia any, err error) {
	switch im.Type {
	case imsg.AuthenticateUser:
		return HandleIAuthenticateUser(im)
	case imsg.CreateUser:
		return HandleICreateUser(im)
	default:
		return nil, nerd.ErrMalformedIMsg
	}
}

// HandleIGetTree converts HttpGetTree message to native GetTree message
func HandleIGetTree(t *msg.Tag) (any, error) {
	return t.Ask(&msg.Msg{
		Type: msg.GetTree,
	})
}

// HandleILookup converts HttpLookup message to native Lookup message
func HandleILookup(t *msg.Tag, im imsg.IMsg) (ia any, err error) {
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
	if t, ok := a.(*msg.Tag); ok {
		ia = t.ToITag()
	}
	return ia, nil
}

// HandleIRenameChild converts HttpRenameChild message to native RenameChild message
func HandleIRenameChild(t *msg.Tag, im imsg.IMsg) (any, error) {
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

// HandleICreateChild converts HttpCreateChild message to native CreateChild message
func HandleICreateChild(t *msg.Tag, im imsg.IMsg) (ia any, err error) {
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
		},
	})
	if t, ok := a.(*msg.Tag); ok {
		ia = t.ToITag()
		addTag(t)
	}
	return ia, err
}

// HandleIShutdown converts HttpShutdown message to native Shutdown message
func HandleIShutdown(t *msg.Tag) (ia any, err error) {
	a, err := t.Ask(&msg.Msg{Type: msg.Shutdown})
	shutdownTags := a.([]*msg.Tag)
	var rootHalted bool
	for _, tag := range shutdownTags {
		tree.removeTag(tag.NodeID)
		if tag.NodeID == 1 {
			rootHalted = true
		}
	}
	// If Root node was shut down, clean up global state for restart
	if rootHalted {
		node.ResetIDCounter()
		node.CloseDatabase()
	}
	return nil, nil
}

// HandleIAuthenticateUser converts HttpAuthenticateUser to native AuthenticateUser message
func HandleIAuthenticateUser(im imsg.IMsg) (ia any, err error) {
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
	if t, ok := a.(*msg.Tag); ok {
		ia = t.ToITag()
	}
	return ia, err
}

// HandleICreateUser converts HttpCreateUser to native CreateUser message
func HandleICreateUser(im imsg.IMsg) (ia any, err error) {
	username, ok := im.Payload["username"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	password, ok := im.Payload["password"].(string)
	if !ok {
		return nil, nerd.ErrMalformedIMsg
	}

	a, err := builtin.System.Authenticator.Ask(&msg.Msg{
		Type: msg.CreateUser,
		Payload: msg.CredentialsPayload{
			Username: username,
			Password: password,
		},
	})
	if t, ok := a.(*msg.Tag); ok {
		ia = t.ToITag()
		addTag(t)
	}
	return ia, err
}
