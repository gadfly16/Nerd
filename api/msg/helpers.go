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
			NodeType: int(nodeType),
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

// AskInternalRename sends an InternalRename message to the target node (for parent-child coordination)
func (t *Tag) AskInternalRename(newName string) error {
	_, err := t.Ask(&Msg{
		Type:    InternalRename,
		Payload: newName,
	})
	return err
}
