package builtin

import (
	"fmt"
	"strings"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
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
	case msg.RenameSelf:
		return handleRename(m, node)
	case msg.DeleteChild:
		return handleDeleteChild(m, node)
	case msg.DeleteSelf:
		return handleDeleteSelf(m, node)
	case msg.GetTree:
		return handleGetTree(m, node)
	case msg.Lookup:
		return handleLookup(m, node)
	default:
		// This should never happen if CommonMsgSeparator is used correctly
		panic(fmt.Sprintf("handleCommonMessage called with non-common message type: %d", m.Type))
	}
}

// handleCreateChild processes requests to create child nodes (shared logic)
func handleCreateChild(m *msg.Msg, n node.Node) (any, error) {
	// Parent entity
	pe := n.GetEntity()

	// Parse message pl
	pl, ok := m.Payload.(msg.CreateChildPayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Auto-generate name if not provided
	if pl.Name != "" {
		// Check for illegal '#' in name
		if strings.Contains(pl.Name, "#") {
			return nil, nerd.ErrIllegalHashmarkInName
		}
		// Check for name collision
		if _, exists := pe.Children[pl.Name]; exists {
			return nil, fmt.Errorf("child with name '%s' already exists", pl.Name)
		}
	}

	// Check if node type is supported as a child of this node
	pti := pe.NodeType.Info()
	var allowed bool
	for _, acht := range pti.AllowedChildren {
		if acht == pl.NodeType {
			allowed = true
		}
	}
	if !allowed {
		return nil, nerd.ErrUnsupportedNodeType
	}

	// Create appropriate node instance based on type and name
	chn, err := newNode(pl)
	if err != nil {
		return nil, err
	}
	// Children entity
	che := chn.GetEntity()

	// Auto-generate name if not provided
	if pl.Name == "" {
		pl.Name = fmt.Sprintf("New %s #%d", pl.NodeType.Info().Name, che.NodeID)
	}

	// Set parent-child relationship
	che.ParentID = (pe.Tag.NodeID)

	// Link child's cache validity to parent's
	che.CacheValidity.Parent = &pe.CacheValidity

	// Save the child if not a runtime node
	if che.NodeID > 0 {
		err := chn.Save()
		if err != nil {
			return nil, err
		}
	}

	// Add child to parent's children map using name as key
	pe.Children[chn.GetName()] = chn.GetTag()

	// Invalidate parent's cache since tree structure changed
	pe.CacheValidity.InvalidateTreeEntry()

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
		NodeID:   e.NodeID,
		Name:     e.Name,
		NodeType: e.NodeType,
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

// handleLookup processes lookup requests by path (shared logic)
func handleLookup(m *msg.Msg, n node.Node) (any, error) {
	// Parse payload
	path, ok := m.Payload.(msg.LookupPayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Empty path is a programming error - adapter should never send this
	if len(path) == 0 {
		panic("handleLookup called with empty path")
	}

	e := n.GetEntity()

	// Find child by name
	childTag, exists := e.Children[path[0]]
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Single segment - return the child directly
	if len(path) == 1 {
		return childTag, nil
	}

	// Multi-segment path - recursively lookup in child with remaining path
	return childTag.AskLookup(path[1:])
}

// handleDeleteChild processes requests to delete child nodes by ID (shared logic)
func handleDeleteChild(m *msg.Msg, n node.Node) (any, error) {
	e := n.GetEntity()

	// Parse message payload
	childID, ok := m.Payload.(nerd.NodeID)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Find child by ID in children map
	var childName string
	var childTag *msg.Tag
	for name, tag := range e.Children {
		if tag.NodeID == childID {
			childName = name
			childTag = tag
			break
		}
	}

	if childTag == nil {
		return nil, nerd.ErrNodeNotFound
	}

	// Ask child to delete itself
	err := childTag.AskDeleteSelf()
	if err != nil {
		return nil, err
	}

	// Remove from parent's children map
	delete(e.Children, childName)

	// Invalidate parent's cache since tree structure changed
	e.CacheValidity.InvalidateTreeEntry()

	return childTag, nil
}

// handleDeleteSelf processes delete requests from parent (internal operation)
func handleDeleteSelf(_ *msg.Msg, n node.Node) (any, error) {
	e := n.GetEntity()

	// Check if node has children - cannot delete if it does
	if len(e.Children) > 0 {
		return nil, fmt.Errorf("cannot delete node with children")
	}

	// Delete from database (only for persistent nodes with positive IDs)
	if e.NodeID > 0 {
		result := node.DB.Delete(&node.Entity{}, e.NodeID)
		if result.Error != nil {
			return nil, fmt.Errorf("failed to delete from database: %w", result.Error)
		}
	}

	// Node-specific cleanup
	n.Shutdown()

	return nil, nil
}
