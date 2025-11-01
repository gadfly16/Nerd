package tree

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// load recursively loads a node and all its children from the database
// Registers all nodes in the tree and returns the loaded node's tag
func load(e *node.Entity) (*msg.Tag, error) {
	// 0. Initialize runtime fields first
	e.Incoming = make(msg.MsgChan)
	e.Children = make(map[string]*msg.Tag)
	e.CacheValidity = node.CacheValidity{}

	// 1. Create the appropriate node using builtin registry
	nodeInstance, err := node.LoadBuiltinNodeFromEntity(e)
	if err != nil {
		return nil, fmt.Errorf("failed to load node: %w", err)
	}

	// 2. Load children identities from database
	var children []*node.Entity
	result := node.DB.Where("parent_id = ?", e.NodeID).Find(&children)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to load children: %w", result.Error)
	}

	// 3. Recursively load each child
	for _, child := range children {
		// Set ownership: User nodes own themselves, others inherit parent's owner
		if child.NodeType == nerd.UserNode {
			child.Tag.Owner = child.Tag
		} else {
			child.Tag.Owner = e.Tag.Owner
		}

		childTag, err := load(child)
		if err != nil {
			return nil, fmt.Errorf("failed to load child %s: %w", child.Name, err)
		}

		// Add child to parent's children map
		e.Children[child.Name] = childTag

		// Link cache validity
		child.CacheValidity.Parent = &e.CacheValidity
	}

	// 4. Start the node
	nodeInstance.Run()

	// 5. Register node in the tree
	selfTag := nodeInstance.GetTag()
	registry.add(selfTag)

	return selfTag, nil
}
