package tree

import (
	"fmt"

	"github.com/gadfly16/nerd/api/node"
)

// Run loads the existing tree from database and starts all nodes
func Run(dbPath string) error {
	// Open database connection
	err := OpenDB(dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Initialize the tree structure
	initTree()

	// Load Root identity from database
	var rootIdentity node.Identity
	result := node.DB.Where("node_id = ?", 1).First(&rootIdentity)
	if result.Error != nil {
		return fmt.Errorf("failed to load root identity: %w", result.Error)
	}

	// Load the entire tree recursively
	allTags, err := rootIdentity.Load()
	if err != nil {
		return fmt.Errorf("failed to load tree: %w", err)
	}

	// Register all tags with the tree
	for _, tag := range allTags {
		addTag(tag)
	}

	fmt.Printf("Successfully loaded and started tree with %d nodes\n", len(allTags))
	return nil
}
