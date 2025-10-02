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
	case msg.Rename:
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
	e := n.GetEntity()
	// Parse message pl
	pl, ok := m.Payload.(msg.CreateChildPayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Check for name collision
	if pl.Name != "" {
		if _, exists := e.Children[pl.Name]; exists {
			return nil, fmt.Errorf("child with name '%s' already exists", pl.Name)
		}
	}

	// TODO: check if node type is supported as a child of this node

	// Create appropriate node instance based on type and name
	chn := NewNode(pl.NodeType, pl.Name)

	// Set parent-child relationship
	chn.SetParentID(e.Tag.NodeID)

	// Link child's cache validity to parent's
	chn.GetEntity().CacheValidity.Parent = &e.CacheValidity

	// Save the child (name is already set in constructor)
	err := chn.Save()
	if err != nil {
		return nil, err
	}

	// Add child to parent's children map using name as key
	e.Children[chn.GetName()] = chn.GetTag()

	// Invalidate parent's cache since tree structure changed
	e.CacheValidity.InvalidateTreeEntry()

	// Start the child node
	chn.Run()

	return chn.GetTag(), nil
}

// handleShutdown processes shutdown requests (shared logic)
func handleShutdown(_ *msg.Msg, n node.Node) (any, error) {
	e := n.GetEntity()

	// 1. Collect tags of all shutdown nodes (start with this node)
	var shutdownTags []*msg.Tag
	shutdownTags = append(shutdownTags, e.Tag)

	// 2. Ask all children to shutdown and accumulate their shutdown tags
	if len(e.Children) > 0 {
		err := e.AskChildren(&msg.Msg{
			Type:    msg.Shutdown,
			Payload: nil,
		}).Reduce(func(payload any) {
			// Each child returns its own list of shutdown tags
			if childTags, ok := payload.([]*msg.Tag); ok {
				shutdownTags = append(shutdownTags, childTags...)
			}
		})
		if err != nil {
			fmt.Printf("Error during children shutdown: %v\n", err)
		}
	}

	// 3. Run cleanup operations (node-specific)
	n.Shutdown()

	// 4. Return all shutdown tags
	return shutdownTags, nil
}

// handleGetTree processes requests for tree structure (shared logic)
func handleGetTree(_ *msg.Msg, n node.Node) (any, error) {
	e := n.GetEntity()

	// Check cache first
	if e.CacheValidity.TreeEntry.Load() {
		return e.CachedTreeEntry, nil
	}

	// Build tree entry for this node
	entry := &msg.TreeEntry{
		NodeID: e.NodeID,
		Name:   e.Name,
	}

	// Build children entries (always full subtree)
	var children []*msg.TreeEntry
	if len(e.Children) > 0 {
		// Ask all children concurrently for their tree structure
		err := e.AskChildren(&msg.Msg{
			Type: msg.GetTree,
		}).Reduce(func(payload any) {
			children = append(children, payload.(*msg.TreeEntry))
		})

		if err != nil {
			return nil, fmt.Errorf("failed to get tree from children: %w", err)
		}
	}

	entry.Children = children

	// Cache the result and mark as valid
	e.CachedTreeEntry = entry
	e.CacheValidity.TreeEntry.Store(true)

	return entry, nil
}

// handleRenameChild processes requests to rename child nodes (shared logic)
func handleRenameChild(m *msg.Msg, n node.Node) (any, error) {
	e := n.GetEntity()

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
	ch, exists := e.Children[pl.OldName]
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Check if new name already exists (collision check)
	if _, collision := e.Children[pl.NewName]; collision {
		return nil, nerd.ErrNameCollision
	}

	// Ask child to rename itself
	err := ch.AskRename(pl.NewName)
	if err != nil {
		return nil, err
	}

	// Update parent's children map
	delete(e.Children, pl.OldName)
	e.Children[pl.NewName] = ch

	// Invalidate parent's cache since tree structure changed
	e.CacheValidity.InvalidateTreeEntry()

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
