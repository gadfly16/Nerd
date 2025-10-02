package msg

import "github.com/gadfly16/nerd/api/nerd"

// Helper functions for common message operations
// These provide cleaner APIs and future extension points for logging, validation, etc.

// AskCreateChild sends a CreateChild message to the target node
// If name is empty, the node will auto-generate its name
func (t *Tag) AskCreateChild(nodeType nerd.NodeType, name string) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type: CreateChild,
		Payload: CreateChildPayload{
			NodeType: nodeType,
			Name:     name,
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

// AskRename sends a Rename message to the target node (for parent-child coordination)
func (t *Tag) AskRename(newName string) error {
	_, err := t.Ask(&Msg{
		Type:    Rename,
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

// AskAuthenticateChild sends an AuthenticateChild message to the Authenticator node
func (t *Tag) AskAuthenticateChild(username, password string) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type: AuthenticateChild,
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
func (t *Tag) AskCreateUser(username, password string) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type: CreateUser,
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

// AskAuthenticate sends an Authenticate message to a User node
func (t *Tag) AskAuthenticate(password string) (*Tag, error) {
	result, err := t.Ask(&Msg{
		Type:    Authenticate,
		Payload: password,
	})
	if err != nil {
		return nil, err
	}
	return result.(*Tag), nil
}
