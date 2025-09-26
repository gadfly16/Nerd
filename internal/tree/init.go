package tree

import (
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/builtin"
)

// InitInstance initializes a new Nerd instance by setting up the database
// and bootstrapping the Root node using runtime infrastructure
func InitInstance(dbPath string) error {
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

	// Create new Group node (auto-generated name)
	t, err := root.AskCreateChild(node.Group, "")
	if err != nil {
		return err
	}
	addTag(t)

	// Rename the Group node to "System"
	err = root.AskRenameChild("New Group #2", "System")
	if err != nil {
		return err
	}

	err = root.AskShutdown()
	if err != nil {
		return err
	}

	return nil
}
