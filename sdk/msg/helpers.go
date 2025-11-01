package msg

import "github.com/gadfly16/nerd/api/nerd"

// Helper functions for common message operations
// These provide cleaner APIs and future extension points for logging, validation, etc.
// Pattern: sender.AskXxx(receiver, ...) sends a message from sender to receiver

// AskCreateChild sends a CreateChild message from sender to receiver
// If name is empty, the node will auto-generate its name
// spec is optional node-specific initialization data
func (sender *Tag) AskCreateChild(receiver *Tag, nodeType nerd.NodeType, name string, spec any) (NewNodePayload, error) {
	result, err := sender.Ask(receiver, &Msg{
		Type: CreateChild,
		Payload: CreateChildPayload{
			NodeType: nodeType,
			Name:     name,
			Spec:     spec,
		},
	})
	if err != nil {
		return NewNodePayload{}, err
	}
	return result.(NewNodePayload), nil
}

// AskRenameChild sends a RenameChild message from sender to receiver
func (sender *Tag) AskRenameChild(receiver *Tag, oldName, newName string) error {
	_, err := sender.Ask(receiver, &Msg{
		Type: RenameChild,
		Payload: RenameChildPayload{
			OldName: oldName,
			NewName: newName,
		},
	})
	return err
}

// AskShutdown sends a Shutdown message from sender to receiver
func (sender *Tag) AskShutdown(receiver *Tag) error {
	_, err := sender.Ask(receiver, &Msg{
		Type: Shutdown,
	})
	return err
}

// AskDeleteChild sends a DeleteChild message from sender to receiver to delete a child by name
func (sender *Tag) AskDeleteChild(receiver *Tag, childName string) error {
	_, err := sender.Ask(receiver, &Msg{
		Type:    DeleteChild,
		Payload: childName,
	})
	return err
}

// AskDeleteSelf sends a DeleteSelf message from sender to receiver (for parent-child coordination)
func (sender *Tag) AskDeleteSelf(receiver *Tag) error {
	_, err := sender.Ask(receiver, &Msg{
		Type: DeleteSelf,
	})
	return err
}

// AskRename sends a RenameSelf message from sender to receiver (for parent-child coordination)
func (sender *Tag) AskRename(receiver *Tag, newName string) error {
	_, err := sender.Ask(receiver, &Msg{
		Type:    RenameSelf,
		Payload: newName,
	})
	return err
}

// AskGetTree sends a GetTree message from sender to receiver (always returns full subtree)
func (sender *Tag) AskGetTree(receiver *Tag) (*TreeEntry, error) {
	result, err := sender.Ask(receiver, &Msg{
		Type: GetTree,
	})
	if err != nil {
		return nil, err
	}
	return result.(*TreeEntry), nil
}

// AskAuthenticateUser sends an AuthenticateUser message from sender to Authenticator node
func (sender *Tag) AskAuthenticateUser(receiver *Tag, username, password string) (*Tag, error) {
	result, err := sender.Ask(receiver, &Msg{
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

// AskAuthenticate sends an AuthenticateSelf message from sender to User node
func (sender *Tag) AskAuthenticate(receiver *Tag, password string) (*Tag, error) {
	result, err := sender.Ask(receiver, &Msg{
		Type:    AuthenticateSelf,
		Payload: password,
	})
	if err != nil {
		return nil, err
	}
	return result.(*Tag), nil
}

// AskLookup sends a Lookup message from sender to receiver to resolve a path to a node tag
func (sender *Tag) AskLookup(receiver *Tag, path []string) (*Tag, error) {
	result, err := sender.Ask(receiver, &Msg{
		Type:    Lookup,
		Payload: LookupPayload(path),
	})
	if err != nil {
		return nil, err
	}
	return result.(*Tag), nil
}

// NotifyTopoSubscribe sends a TopoSubscribe message from sender to receiver to register for topology updates
func (sender *Tag) NotifyTopoSubscribe(receiver *Tag, guiTag *Tag) {
	sender.Notify(receiver, &Msg{
		Type:    TopoSubscribe,
		Payload: guiTag,
	})
}

// NotifyTopoUnsubscribe sends a TopoUnsubscribe message from sender to receiver to unregister from topology updates
func (sender *Tag) NotifyTopoUnsubscribe(receiver *Tag, guiTag *Tag) {
	sender.Notify(receiver, &Msg{
		Type:    TopoUnsubscribe,
		Payload: guiTag,
	})
}

// NotifyTopoUpdate sends a TopoUpdate notification from sender to receiver about topology changes
// No-op if receiver is nil (TopoUpdater not running)
func (sender *Tag) NotifyTopoUpdate(receiver *Tag) {
	if receiver == nil {
		return
	}
	sender.Notify(receiver, &Msg{
		Type: TopoUpdate,
	})
}
