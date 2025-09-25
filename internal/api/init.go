package api

import (
	"github.com/gadfly16/nerd/internal/nerd"
	"github.com/gadfly16/nerd/internal/nodes"
)

// InitInstance initializes a new Nerd instance by setting up the database
// and bootstrapping the Root node using runtime infrastructure
func InitInstance(dbPath string) error {
	err := nodes.InitDatabase(dbPath)
	if err != nil {
		return err
	}

	// Initialize the tree structure
	nerd.InitTree()

	// Bootstrap Root node
	rootNode := nodes.NewNode(nodes.RootNode, "") // Root ignores name parameter
	err = rootNode.Save()
	if err != nil {
		return err
	}

	// Start Root node briefly to establish the tree structure
	rootNode.Run()
	root := rootNode.GetTag()
	nerd.AddTag(root)

	// Create new Group node (auto-generated name)
	_, err = nerd.AskCreateChild(root, nodes.GroupNode, "")
	if err != nil {
		return err
	}

	// Rename the Group node to "System"
	err = nerd.AskRenameChild(root, "New Group #2", "System")
	if err != nil {
		return err
	}

	err = nerd.AskShutdown(root)
	if err != nil {
		return err
	}

	return nil
}
