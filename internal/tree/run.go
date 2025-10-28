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
	systemTag, err := rootTag.AskLookup([]string{"System"})
	if err != nil {
		return fmt.Errorf("failed to lookup System group: %w", err)
	}

	_, err = systemTag.AskCreateChild(nerd.TopoUpdaterNode, "TopoUpdater", nil)
	if err != nil {
		return fmt.Errorf("failed to create TopoUpdater: %w", err)
	}

	return nil
}
