package tree

import (
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/builtin"
)

// Init initializes a new Nerd instance by setting up the database
// and bootstrapping the Root node using runtime infrastructure
func Init(dbPath string) error {
	err := InitDatabase(dbPath)
	if err != nil {
		return err
	}

	// Initialize the tree structure
	initTree()

	// Bootstrap Root node
	rootNode := builtin.NewNode(node.Root, "") // Root ignores name parameter
	err = rootNode.Save()
	if err != nil {
		return err
	}

	// Start Root node briefly to establish the tree structure
	rootNode.Run()
	root := rootNode.GetTag()
	addTag(root)

	// Create System group directly with name
	t, err := root.AskCreateChild(node.Group, "System")
	if err != nil {
		return err
	}
	addTag(t)

	err = root.AskShutdown()
	if err != nil {
		return err
	}

	return nil
}
