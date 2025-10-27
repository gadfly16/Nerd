package tree

import (
	"fmt"

	"github.com/gadfly16/nerd/sdk/node"
)

// Run loads the existing tree from database and starts all nodes
func Run(dbPath string) error {
	// Open existing database
	err := OpenDatabase(dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Initialize ID counter to highest existing ID
	node.InitPersistentIDCounter()

	// Load Root identity from database
	var rootEntity node.Entity
	result := node.DB.Where("node_id = ?", 1).First(&rootEntity)
	if result.Error != nil {
		return fmt.Errorf("failed to load root identity: %w", result.Error)
	}

	// Load the entire tree recursively
	allTags, err := rootEntity.Load()
	if err != nil {
		return fmt.Errorf("failed to load tree: %w", err)
	}

	// Register all tags with the tree
	for _, tag := range allTags {
		registry.add(tag)
	}

	return nil
}
