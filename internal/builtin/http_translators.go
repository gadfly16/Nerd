package builtin

import (
	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/httpmsg"
)

// translateHttpGetTree converts HttpGetTree message to native GetTree message
func translateHttpGetTree(httpMsg httpmsg.HttpMsg) (*msg.Msg, error) {
	// Validate payload contains depth field
	depth, ok := httpMsg.Payload["depth"]
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	// Validate depth is numeric
	depthFloat, ok := depth.(float64) // JSON numbers come as float64
	if !ok {
		return nil, nerd.ErrMalformedHttpMessage
	}

	return &msg.Msg{
		Type: msg.GetTree,
		Payload: msg.GetTreePayload{
			Depth: int(depthFloat),
		},
	}, nil
}

// TranslateHttpMessage converts HTTP message to native message using appropriate translator
func TranslateHttpMessage(httpMsg httpmsg.HttpMsg) (*msg.Msg, error) {
	switch httpMsg.Type {
	case httpmsg.HttpGetTree:
		return translateHttpGetTree(httpMsg)
	case httpmsg.HttpCreateChild:
		return translateHttpCreateChild(httpMsg)
	case httpmsg.HttpRenameChild:
		return translateHttpRenameChild(httpMsg)
	default:
		return nil, nerd.ErrMalformedHttpMessage
	}
}

// translateHttpCreateChild converts HttpCreateChild message to native CreateChild message
func translateHttpCreateChild(httpMsg httpmsg.HttpMsg) (*msg.Msg, error) {
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
func translateHttpRenameChild(httpMsg httpmsg.HttpMsg) (*msg.Msg, error) {
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
