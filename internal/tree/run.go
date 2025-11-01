package tree

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
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

	// Load the entire tree recursively (registers all nodes)
	rootTag, err := load(&rootEntity)
	if err != nil {
		return fmt.Errorf("failed to load tree: %w", err)
	}

	// Create runtime TopoUpdater node under System group
	// Root is the sender (owner of itself)
	systemTag, err := rootTag.Owner.AskLookup(rootTag, []string{"System"})
	if err != nil {
		return fmt.Errorf("failed to lookup System group: %w", err)
	}

	// System's owner is Root, so Root is the sender
	_, err = systemTag.Owner.AskCreateChild(systemTag, nerd.TopoUpdaterNode, "TopoUpdater", nil)
	if err != nil {
		return fmt.Errorf("failed to create TopoUpdater: %w", err)
	}

	return nil
}
