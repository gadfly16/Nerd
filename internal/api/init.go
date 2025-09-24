package api

import (
	"github.com/gadfly16/nerd/internal/msg"
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
	rootNode := nodes.NewNode(nodes.RootNode)
	err = rootNode.Save()
	if err != nil {
		return err
	}

	// Start Root node briefly to establish the tree structure
	rootNode.Run()
	root := rootNode.GetTag()
	nerd.AddTag(root)

	// Create new Group node
	_, err = root.Ask(&nerd.Msg{
		Type:    msg.CreateChild,
		Payload: nodes.GroupNode,
	})
	if err != nil {
		return err
	}

	// Rename the Group node to "System"
	_, err = root.Ask(&nerd.Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: "New Group #2",
			NewName: "System",
		},
	})
	if err != nil {
		return err
	}

	_, err = root.Ask(&nerd.Msg{
		Type: msg.Shutdown,
	})
	if err != nil {
		return err
	}

	return nil
}
