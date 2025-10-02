package api

import (
	"log"

	"github.com/gadfly16/nerd/internal/server"
	"github.com/gadfly16/nerd/internal/tree"
)

func Run(dbPath string) error {
	// Start the tree (load from database)
	err := tree.Run(dbPath)
	if err != nil {
		return err
	}

	// Start the HTTP server
	webRoot := "./web/dist"
	port := "8080"

	srv := server.NewServer(port, webRoot)
	log.Printf("Starting Nerd with tree loaded from %s", dbPath)

	return srv.Start()
}
