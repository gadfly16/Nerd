package nerd

import "github.com/gadfly16/nerd/internal/msg"

// Helper functions for common message operations
// These provide cleaner APIs and future extension points for logging, validation, etc.

// AskCreateChild sends a CreateChild message to the target node
// If name is empty, the node will auto-generate its name
func AskCreateChild(target *Tag, nodeType NodeType, name string) (*Tag, error) {
	result, err := target.Ask(&Msg{
		Type: msg.CreateChild,
		Payload: msg.CreateChildPayload{
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
func AskRenameChild(target *Tag, oldName, newName string) error {
	_, err := target.Ask(&Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: oldName,
			NewName: newName,
		},
	})
	return err
}

// AskShutdown sends a Shutdown message to the target node
func AskShutdown(target *Tag) error {
	_, err := target.Ask(&Msg{
		Type: msg.Shutdown,
	})
	return err
}

// AskInternalRename sends an InternalRename message to the target node (for parent-child coordination)
func AskInternalRename(target *Tag, newName string) error {
	_, err := target.Ask(&Msg{
		Type:    msg.InternalRename,
		Payload: newName,
	})
	return err
}
