package msg

import "github.com/gadfly16/nerd/api/nerd"

// Helper functions for common message operations
// These provide cleaner APIs and future extension points for logging, validation, etc.

// AskCreateChild sends a CreateChild message to the target node
// If name is empty, the node will auto-generate its name
// spec is optional node-specific initialization data
func (t *Tag) AskCreateChild(nodeType nerd.NodeType, name string, spec any) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type: CreateChild,
		Payload: CreateChildPayload{
			NodeType: nodeType,
			Name:     name,
			Spec:     spec,
		},
	})
	if err != nil {
		return nil, err
	}
	return result.(*Tag), nil
}

// AskRenameChild sends a RenameChild message to the target node
func (t *Tag) AskRenameChild(oldName, newName string) error {
	_, err := t.Ask(&Msg{
		Type: RenameChild,
		Payload: RenameChildPayload{
			OldName: oldName,
			NewName: newName,
		},
	})
	return err
}

// AskShutdown sends a Shutdown message to the target node
func (t *Tag) AskShutdown() error {
	_, err := t.Ask(&Msg{
		Type: Shutdown,
	})
	return err
}

// AskDeleteChild sends a DeleteChild message to delete a child by ID
func (t *Tag) AskDeleteChild(childID nerd.NodeID) error {
	_, err := t.Ask(&Msg{
		Type:    DeleteChild,
		Payload: childID,
	})
	return err
}

// AskDeleteSelf sends a DeleteSelf message to the target node (for parent-child coordination)
func (t *Tag) AskDeleteSelf() error {
	_, err := t.Ask(&Msg{
		Type: DeleteSelf,
	})
	return err
}

// AskRename sends a Rename message to the target node (for parent-child coordination)
func (t *Tag) AskRename(newName string) error {
	_, err := t.Ask(&Msg{
		Type:    RenameSelf,
		Payload: newName,
	})
	return err
}

// AskGetTree sends a GetTree message to the target node (always returns full subtree)
func (t *Tag) AskGetTree() (*TreeEntry, error) {
	result, err := t.Ask(&Msg{
		Type: GetTree,
	})
	if err != nil {
		return nil, err
	}
	return result.(*TreeEntry), nil
}

// AskAuthenticateUser sends an AuthenticateUser message to the Authenticator node
func (t *Tag) AskAuthenticateUser(username, password string) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type: AuthenticateUser,
		Payload: CredentialsPayload{
			Username: username,
			Password: password,
		},
	})
	if err != nil {
		return nil, err
	}
	return result.(*Tag), nil
}

// AskCreateUser sends a CreateUser message to the Authenticator node

// AskAuthenticate sends an Authenticate message to a User node
func (t *Tag) AskAuthenticate(password string) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type:    AuthenticateSelf,
		Payload: password,
	})
	if err != nil {
		return nil, err
	}
	return result.(*Tag), nil
}

// AskLookup sends a Lookup message to resolve a path to a node tag
func (t *Tag) AskLookup(path []string) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type:    Lookup,
		Payload: LookupPayload(path),
	})
	if err != nil {
		return nil, err
	}
	return result.(*Tag), nil
}

// NotifyTopoSubscribe sends a TopoSubscribe message to register for topology updates
func (t *Tag) NotifyTopoSubscribe(guiTag *Tag) {
	t.Notify(&Msg{
		Type:    TopoSubscribe,
		Payload: guiTag,
	})
}

// NotifyTopoUnsubscribe sends a TopoUnsubscribe message to unregister from topology updates
func (t *Tag) NotifyTopoUnsubscribe(guiTag *Tag) {
	t.Notify(&Msg{
		Type:    TopoUnsubscribe,
		Payload: guiTag,
	})
}
