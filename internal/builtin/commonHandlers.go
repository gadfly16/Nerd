package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// topoDispatcher is a function registered by the tree layer to handle topology operations
// This allows topology handlers to access the registry without exposing it to node implementations
// Set by init() in internal/tree/topoHandlers.go to tree.HandleTopoMessage()
var topoDispatcher func(*msg.Msg, node.Node) (any, error)

// RegisterTopoDispatcher registers the topology message handler from the tree layer
// This must be called during initialization before any nodes start processing messages
func RegisterTopoDispatcher(fn func(*msg.Msg, node.Node) (any, error)) {
	if topoDispatcher != nil {
		panic("trying to register topoDispatcher twice")
	}
	topoDispatcher = fn
}

// handleCommonMessage processes messages shared across all node types
// Returns true if message was handled, false if node-specific handling needed
func handleCommonMessage(m *msg.Msg, node node.Node) (any, error) {
	switch m.Type {
	case msg.RenameSelf:
		return handleRename(m, node)
	case msg.DeleteSelf:
		return handleDeleteSelf(m, node)
	case msg.GetTree:
		return handleGetTree(m, node)
	case msg.Lookup:
		return handleLookup(m, node)
	case msg.GetState:
		return handleGetState(m, node)
	default:
		// Topology operations (CreateChild, DeleteChild, RenameChild) handled by tree layer
		return topoDispatcher(m, node)
	}
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

// handleRename processes rename requests from parent (internal operation)
func handleRename(m *msg.Msg, n node.Node) (any, error) {
	// Parse message payload
	newName, ok := m.Payload.(string)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Update node name
	n.SetName(newName)

	// Invalidate cache since name changed (propagates upstream)
	n.GetEntity().CacheValidity.InvalidateTreeEntry()

	// Notify TopoUpdater of topology change (owner is the sender)
	n.GetEntity().Tag.Owner.NotifyTopoUpdate(node.System.TopoUpdater)

	// Save to database (only for persistent nodes with positive IDs)
	if n.GetEntity().NodeID > 0 {
		err := n.Save()
		if err != nil {
			return nil, err
		}
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
	return m.Sender.AskLookup(childTag, path[1:])
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

	return nil, nil
}


// handleGetState returns state values as a slice of ValuePair
func handleGetState(_ *msg.Msg, n node.Node) (any, error) {
	e := n.GetEntity()

	// Build base state values
	values := []msg.ValuePair{
		{Name: "id", Value: e.NodeID},
	}

	// Let node extend with its own state values
	values = n.GetState(values)

	return values, nil
}
