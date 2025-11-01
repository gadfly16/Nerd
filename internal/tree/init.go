package tree

import (
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/builtin"
)

// InitInstance initializes a new Nerd instance by setting up the database
// and bootstrapping the Root node using runtime infrastructure
func InitInstance(dbPath string) error {
	err := InitDatabase(dbPath)
	if err != nil {
		return err
	}

	// Bootstrap Root node
	root := builtin.NewRoot() // Root ignores name parameter
	err = root.Save()
	if err != nil {
		return err
	}

	// Start Root node briefly to establish the tree structure
	root.Run()
	registry.add(root.Tag)

	// Create System group directly with name (owner is the sender, which is Root itself)
	_, err = root.Tag.Owner.AskCreateChild(root.Tag, nerd.GroupNode, "System", nil)
	if err != nil {
		return err
	}

	// Create Authenticator singleton (owner is the sender, which is Root itself)
	_, err = root.Tag.Owner.AskCreateChild(root.Tag, nerd.AuthenticatorNode, "Authenticator", nil)
	if err != nil {
		return err
	}

	err = root.Tag.Owner.AskShutdown(root.Tag)
	if err != nil {
		return err
	}

	return nil
}
