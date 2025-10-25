package api

import (
	"log"

	"github.com/gadfly16/nerd/internal/tree"
)

func Run(dbPath string) error {
	// Start the tree (load from database)
	err := tree.Run(dbPath)
	if err != nil {
		return err
	}

	log.Printf("Tree loaded from %s", dbPath)
	return nil
}
