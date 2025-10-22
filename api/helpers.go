package api

import (
	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/tree"
	"github.com/gadfly16/nerd/sdk/msg"
)

// IAskGetTree requests the tree structure from a node
func IAskGetTree(targetID, userID nerd.NodeID) (*msg.TreeEntry, error) {
	result, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.GetTree,
		TargetID: targetID,
		UserID:   userID,
	})
	if err != nil {
		return nil, err
	}
	return result.(*msg.TreeEntry), nil
}

// IAskLookup finds a node by path relative to the target node
func IAskLookup(targetID, userID nerd.NodeID, path string) (*imsg.ITag, error) {
	result, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.Lookup,
		TargetID: targetID,
		UserID:   userID,
		Payload: map[string]any{
			"path": path,
		},
	})
	if err != nil {
		return nil, err
	}
	return result.(*imsg.ITag), nil
}

// IAskCreateChild creates a new child node under the target node
func IAskCreateChild(targetID, userID nerd.NodeID, nodeType nerd.NodeType, name string) (*imsg.ITag, error) {
	result, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.CreateChild,
		TargetID: targetID,
		UserID:   userID,
		Payload: map[string]any{
			"nodeType": float64(nodeType),
			"name":     name,
		},
	})
	if err != nil {
		return nil, err
	}
	return result.(*imsg.ITag), nil
}

// IAskRenameChild renames a child node of the target node
func IAskRenameChild(targetID, userID nerd.NodeID, oldName, newName string) error {
	_, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.RenameChild,
		TargetID: targetID,
		UserID:   userID,
		Payload: map[string]any{
			"oldName": oldName,
			"newName": newName,
		},
	})
	return err
}

// IAskShutdown requests a node to shut down gracefully
func IAskShutdown(targetID, userID nerd.NodeID) error {
	_, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.Shutdown,
		TargetID: targetID,
		UserID:   userID,
	})
	return err
}

// IAskAuthenticateUser authenticates a user by username and password
func IAskAuthenticateUser(username, password string) (*imsg.ITag, error) {
	result, err := tree.IAskAuth(imsg.IMsg{
		Type: imsg.AuthenticateUser,
		Payload: map[string]any{
			"username": username,
			"password": password,
		},
	})
	if err != nil {
		return nil, err
	}
	return result.(*imsg.ITag), nil
}

// IAskCreateUser creates a new user with the given username and password
func IAskCreateUser(username, password string) (*imsg.ITag, error) {
	result, err := tree.IAskAuth(imsg.IMsg{
		Type: imsg.CreateUser,
		Payload: map[string]any{
			"username": username,
			"password": password,
		},
	})
	if err != nil {
		return nil, err
	}
	return result.(*imsg.ITag), nil
}
