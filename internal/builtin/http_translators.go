package builtin

import (
	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/imsg"
)

// translateHttpGetTree converts HttpGetTree message to native GetTree message
func translateHttpGetTree(_ imsg.IMsg) (*msg.Msg, error) {
	// No payload validation needed - GetTree always returns full subtree
	return &msg.Msg{
		Type: msg.GetTree,
	}, nil
}

// TranslateHttpMessage converts HTTP message to native message using appropriate translator
func TranslateHttpMessage(httpMsg imsg.IMsg) (*msg.Msg, error) {
	switch httpMsg.Type {
	case imsg.GetTree:
		return translateHttpGetTree(httpMsg)
	case imsg.CreateChild:
		return translateHttpCreateChild(httpMsg)
	case imsg.RenameChild:
		return translateHttpRenameChild(httpMsg)
	case imsg.Shutdown:
		return translateHttpShutdown(httpMsg)
	case imsg.AuthenticateUser:
		return translateHttpAuthenticateUser(httpMsg)
	case imsg.CreateUser:
		return translateHttpCreateUser(httpMsg)
	default:
		return nil, nerd.ErrMalformedHttpMessage
	}
}

// translateHttpCreateChild converts HttpCreateChild message to native CreateChild message
func translateHttpCreateChild(httpMsg imsg.IMsg) (*msg.Msg, error) {
	// Validate payload contains nodeType field
	nodeType, ok := httpMsg.Payload["nodeType"]
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	nodeTypeFloat, ok := nodeType.(float64)
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	// Validate name field (optional)
	name := ""
	if nameVal, exists := httpMsg.Payload["name"]; exists {
		nameStr, ok := nameVal.(string)
		if !ok {
			return nil, nerd.ErrMalformedHttpMessage
		}
		name = nameStr
	}

	return &msg.Msg{
		Type: msg.CreateChild,
		Payload: msg.CreateChildPayload{
			NodeType: nerd.NodeType(nodeTypeFloat),
			Name:     name,
		},
	}, nil
}

// translateHttpRenameChild converts HttpRenameChild message to native RenameChild message
func translateHttpRenameChild(httpMsg imsg.IMsg) (*msg.Msg, error) {
	// Validate payload contains oldName field
	oldName, ok := httpMsg.Payload["oldName"]
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	oldNameStr, ok := oldName.(string)
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	// Validate payload contains newName field
	newName, ok := httpMsg.Payload["newName"]
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	newNameStr, ok := newName.(string)
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	return &msg.Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: oldNameStr,
			NewName: newNameStr,
		},
	}, nil
}

// translateHttpShutdown converts HttpShutdown message to native Shutdown message
func translateHttpShutdown(_ imsg.IMsg) (*msg.Msg, error) {
	return &msg.Msg{
		Type: msg.Shutdown,
	}, nil
}

// translateHttpAuthenticateUser converts HttpAuthenticateUser to native AuthenticateUser message
func translateHttpAuthenticateUser(httpMsg imsg.IMsg) (*msg.Msg, error) {
	// Extract username and password from payload
	username, ok := httpMsg.Payload["username"].(string)
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	password, ok := httpMsg.Payload["password"].(string)
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	return &msg.Msg{
		Type: msg.AuthenticateUser,
		Payload: msg.CredentialsPayload{
			Username: username,
			Password: password,
		},
	}, nil
}

// translateHttpCreateUser converts HttpCreateUser to native CreateUser message
func translateHttpCreateUser(httpMsg imsg.IMsg) (*msg.Msg, error) {
	// Extract username and password from payload
	username, ok := httpMsg.Payload["username"].(string)
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	password, ok := httpMsg.Payload["password"].(string)
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	return &msg.Msg{
		Type: msg.CreateUser,
		Payload: msg.CredentialsPayload{
			Username: username,
			Password: password,
		},
	}, nil
}
