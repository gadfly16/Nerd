package api

import (
	"github.com/gadfly16/nerd/internal/nerd"
	"github.com/gadfly16/nerd/internal/nodes"
)

// NotifyNode sends a message to a node (non-blocking)
func NotifyNode(targetID nerd.NodeID, msgType nerd.MsgType, payload any) error {
	tag, exists := nerd.GetTag(targetID)
	if !exists {
		return nerd.ErrNodeNotFound
	}

	return tag.Notify(msgType, payload)
}

// AskNode sends a message to a node and waits for response (blocking)
func AskNode(targetID nerd.NodeID, msgType nerd.MsgType, payload any) (any, error) {
	tag, exists := nerd.GetTag(targetID)
	if !exists {
		return nil, nerd.ErrNodeNotFound
	}

	// Prepare message struct
	m := &nerd.Msg{
		Type:    msgType,
		Payload: payload,
	}

	return tag.Ask(m)
}

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
		Type:    nerd.Create_Child_Msg,
		Payload: nodes.GroupNode,
	})
	if err != nil {
		return err
	}

	_, err = root.Ask(&nerd.Msg{
		Type: nerd.Shutdown_Msg,
	})
	if err != nil {
		return err
	}

	return nil
}
