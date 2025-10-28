package tree

import (
	"fmt"
	"strings"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/builtin"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

func init() {
	// Register topology message handler with builtin package
	builtin.RegisterTopoDispatcher(HandleTopoMessage)
}

// HandleTopoMessage dispatches topology-related messages to appropriate handlers
// This function is called from builtin.handleCommonMessage to isolate topology
// related operations to the tree layer
func HandleTopoMessage(m *msg.Msg, n node.Node) (any, error) {
	switch m.Type {
	case msg.CreateChild:
		return handleCreateChild(m, n)
	case msg.DeleteChild:
		return handleDeleteChild(m, n)
	case msg.RenameChild:
		return handleRenameChild(m, n)
	case msg.Shutdown:
		return handleShutdown(m, n)
	default:
		return nil, fmt.Errorf("handleTopoMessage called with non-topology message type: %d", m.Type)
	}
}

// handleCreateChild processes requests to create child nodes (topology operation)
func handleCreateChild(m *msg.Msg, pn node.Node) (any, error) {
	// Parent entity
	pe := pn.GetEntity()

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
	chn, err := builtin.NewNode(pe, pl)
	if err != nil {
		return nil, err
	}
	// Children entity
	che := chn.GetEntity()

	// Auto-generate name if not provided
	if pl.Name == "" {
		che.Name = fmt.Sprintf("%s #%d", pl.NodeType.Info().Name, che.NodeID)
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

	// Start the child node
	chn.Run()

	// Add child to parent's children
	cht := chn.GetTag()
	pe.Children[chn.GetName()] = cht

	// Register tag to message registry
	registry.add(cht)

	// Invalidate parent's cache since tree structure changed
	pe.InvalidateTreeEntry()

	// Notify TopoUpdater of topology change
	node.System.TopoUpdater.NotifyTopoUpdate()

	return msg.NewNodePayload{
		NodeID: cht.NodeID,
		Name:   che.Name,
		Admin:  cht.Admin,
	}, nil
}

// handleDeleteChild processes requests to delete child nodes by name (topology operation)
func handleDeleteChild(m *msg.Msg, n node.Node) (any, error) {
	pe := n.GetEntity()

	// Parse message payload
	childName, ok := m.Payload.(string)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Find child by name in children map
	childTag, exists := pe.Children[childName]
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Ask child to delete itself
	err := childTag.AskDeleteSelf()
	if err != nil {
		return nil, err
	}

	// Ask child to shut down
	err = childTag.AskShutdown()
	if err != nil {
		return nil, err
	}

	// Remove from registry
	registry.remove(childTag)

	// Remove from parent's children map
	delete(pe.Children, childName)

	// Invalidate parent's cache since tree structure changed
	pe.CacheValidity.InvalidateTreeEntry()

	// Notify TopoUpdater of topology change
	node.System.TopoUpdater.NotifyTopoUpdate()

	return childTag, nil
}

// handleRenameChild processes requests to rename child nodes (topology operation)
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

	// Notify TopoUpdater of topology change
	node.System.TopoUpdater.NotifyTopoUpdate()

	return nil, nil
}

// handleShutdown processes shutdown requests (shared logic)
func handleShutdown(_ *msg.Msg, n node.Node) (any, error) {
	e := n.GetEntity()

	// 2. Ask all children to shutdown and accumulate their shutdown tags
	if len(e.Children) > 0 {
		err := e.AskChildren(&msg.Msg{
			Type:    msg.Shutdown,
			Payload: nil,
		}).Reduce(func(pl any) {})
		if err != nil {
			fmt.Printf("Error during children shutdown: %v\n", err)
		}
	}

	// 3. Run cleanup operations (node-specific)
	n.Shutdown()

	// 4. Unregister node
	registry.remove(e.Tag)

	// 4. Return all shutdown tags
	return e.Tag, nil
}
