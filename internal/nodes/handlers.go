package nodes

import (
	"fmt"

	"github.com/gadfly16/nerd/internal/msg"
	"github.com/gadfly16/nerd/internal/nerd"
)

// handleCommonMessage processes messages shared across all node types
// Returns true if message was handled, false if node-specific handling needed
func (i *Identity) handleCommonMessage(m *nerd.Msg, node nerd.Node) (any, error) {
	switch m.Type {
	case msg.CreateChild:
		return i.handleCreateChild(m, node)
	case msg.Shutdown:
		return i.handleShutdown(m, node)
	case msg.RenameChild:
		return i.handleRenameChild(m, node)
	case msg.InternalRename:
		return i.handleRename(m, node)
	default:
		// This should never happen if CommonMsgSeparator is used correctly
		panic(fmt.Sprintf("handleCommonMessage called with non-common message type: %d", m.Type))
	}
}

// handleCreateChild processes requests to create child nodes (shared logic)
func (i *Identity) handleCreateChild(m *nerd.Msg, _ nerd.Node) (any, error) {
	// Parse message payload
	nodeType, ok := m.Payload.(nerd.NodeType)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// TODO: check if node type is supported as a child of this node

	// Create appropriate node instance based on type
	child := NewNode(nodeType)

	// Set parent-child relationship
	child.SetParentID(i.Tag.NodeID)

	// Generate auto name and set it, then save
	autoName := "New " + child.GetNodeTypeName() + " #" + fmt.Sprintf("%d", child.GetID())
	child.SetName(autoName)
	err := child.Save()
	if err != nil {
		return nil, err
	}

	// Add child to parent's children map using name as key
	i.children[autoName] = child.GetTag()

	// Start the child node
	child.Run()

	// Add the child to the tree
	nerd.AddTag(child.GetTag())

	return child.GetTag(), nil
}

// handleShutdown processes shutdown requests (shared logic)
func (i *Identity) handleShutdown(_ *nerd.Msg, n nerd.Node) (any, error) {
	// 1. Ask all children to shutdown (blocking)
	if len(i.children) > 0 {
		shutdownMsg := &nerd.Msg{
			Type:    msg.Shutdown,
			Payload: nil,
		}
		_, err := i.askChildren(shutdownMsg)
		if err != nil {
			fmt.Printf("Error during children shutdown: %v\n", err)
		}
	}

	// 2. Run cleanup operations (node-specific)
	n.Shutdown()

	// 3. Return response - message loop will exit in post-process
	return nil, nil
}

// handleRenameChild processes requests to rename child nodes (shared logic)
func (i *Identity) handleRenameChild(m *nerd.Msg, _ nerd.Node) (any, error) {
	// Parse message payload
	payload, ok := m.Payload.(msg.RenameChildPayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// If old name equals new name, nothing to do - return success
	if payload.OldName == payload.NewName {
		return nil, nil
	}

	// Check if old name exists in children map
	childTag, exists := i.children[payload.OldName]
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Check if new name already exists (collision check)
	if _, collision := i.children[payload.NewName]; collision {
		return nil, nerd.ErrNameCollision
	}

	// Ask child to rename itself
	err := nerd.AskInternalRename(childTag, payload.NewName)
	if err != nil {
		return nil, err
	}

	// Update parent's children map
	delete(i.children, payload.OldName)
	i.children[payload.NewName] = childTag

	return nil, nil
}

// handleRename processes rename requests from parent (internal operation)
func (i *Identity) handleRename(m *nerd.Msg, n nerd.Node) (any, error) {
	// Parse message payload
	newName, ok := m.Payload.(string)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Update node name
	n.SetName(newName)

	// Save to database
	err := n.Save()
	if err != nil {
		return nil, err
	}

	return nil, nil
}
