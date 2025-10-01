package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
)

// handleCommonMessage processes messages shared across all node types
// Returns true if message was handled, false if node-specific handling needed
func handleCommonMessage(m *msg.Msg, node node.Node) (any, error) {
	switch m.Type {
	case msg.CreateChild:
		return handleCreateChild(m, node)
	case msg.Shutdown:
		return handleShutdown(m, node)
	case msg.RenameChild:
		return handleRenameChild(m, node)
	case msg.InternalRename:
		return handleRename(m, node)
	case msg.GetTree:
		return handleGetTree(m, node)
	default:
		// This should never happen if CommonMsgSeparator is used correctly
		panic(fmt.Sprintf("handleCommonMessage called with non-common message type: %d", m.Type))
	}
}

// handleCreateChild processes requests to create child nodes (shared logic)
func handleCreateChild(m *msg.Msg, n node.Node) (any, error) {
	i := n.GetIdentity()
	// Parse message pl
	pl, ok := m.Payload.(msg.CreateChildPayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Check for name collision
	if pl.Name != "" {
		if _, exists := i.Children[pl.Name]; exists {
			return nil, fmt.Errorf("child with name '%s' already exists", pl.Name)
		}
	}

	// TODO: check if node type is supported as a child of this node

	// Create appropriate node instance based on type and name
	chn := NewNode(pl.NodeType, pl.Name)

	// Set parent-child relationship
	chn.SetParentID(i.Tag.NodeID)

	// Save the child (name is already set in constructor)
	err := chn.Save()
	if err != nil {
		return nil, err
	}

	// Add child to parent's children map using name as key
	childName := chn.GetName()
	i.Children[childName] = chn.GetTag()

	// Start the child node
	chn.Run()

	return chn.GetTag(), nil
}

// handleShutdown processes shutdown requests (shared logic)
func handleShutdown(_ *msg.Msg, n node.Node) (any, error) {
	i := n.GetIdentity()

	// 1. Ask all children to shutdown (blocking)
	if len(i.Children) > 0 {
		shutdownMsg := &msg.Msg{
			Type:    msg.Shutdown,
			Payload: nil,
		}
		err := i.AskChildren(shutdownMsg).Reduce(func(payload any) {
			// No accumulation needed for shutdown - just ignore responses
		})
		if err != nil {
			fmt.Printf("Error during children shutdown: %v\n", err)
		}
	}

	// 2. Run cleanup operations (node-specific)
	n.Shutdown()

	// 3. Return response - message loop will exit in post-process
	return nil, nil
}

// handleGetTree processes requests for tree structure (shared logic)
func handleGetTree(m *msg.Msg, n node.Node) (any, error) {
	i := n.GetIdentity()

	// Parse message payload
	pl, ok := m.Payload.(msg.GetTreePayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Build tree entry for this node
	entry := &msg.TreeEntry{
		NodeID: i.NodeID,
		Name:   i.Name,
	}

	// If depth is 0, return just this node without children
	if pl.Depth == 0 {
		entry.Children = []*msg.TreeEntry{}
		return entry, nil
	}

	// Build children entries if depth allows
	var children []*msg.TreeEntry
	if (pl.Depth < 0 || pl.Depth > 0) && len(i.Children) > 0 {
		// Calculate remaining depth for children
		childDepth := pl.Depth
		if pl.Depth > 0 {
			childDepth = pl.Depth - 1
		}

		// Ask all children concurrently for their tree structure using builder pattern
		err := i.AskChildren(&msg.Msg{
			Type: msg.GetTree,
			Payload: msg.GetTreePayload{
				Depth: childDepth,
			},
		}).Reduce(func(payload any) {
			children = append(children, payload.(*msg.TreeEntry))
		})

		if err != nil {
			return nil, fmt.Errorf("failed to get tree from children: %w", err)
		}
	}

	entry.Children = children
	return entry, nil
}

// handleRenameChild processes requests to rename child nodes (shared logic)
func handleRenameChild(m *msg.Msg, n node.Node) (any, error) {
	i := n.GetIdentity()

	// Parse message pl
	pl, ok := m.Payload.(msg.RenameChildPayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// If old name equals new name, nothing to do - return success
	if pl.OldName == pl.NewName {
		return nil, nil
	}

	// Check if old name exists in children map
	ch, exists := i.Children[pl.OldName]
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Check if new name already exists (collision check)
	if _, collision := i.Children[pl.NewName]; collision {
		return nil, nerd.ErrNameCollision
	}

	// Ask child to rename itself
	err := ch.AskInternalRename(pl.NewName)
	if err != nil {
		return nil, err
	}

	// Update parent's children map
	delete(i.Children, pl.OldName)
	i.Children[pl.NewName] = ch

	return nil, nil
}

// handleRename processes rename requests from parent (internal operation)
func handleRename(m *msg.Msg, n node.Node) (any, error) {
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
