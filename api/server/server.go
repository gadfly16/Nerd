package server

import (
	"log"

	"github.com/gadfly16/nerd/internal/server"
)

// Start initializes and starts the HTTP server
func Start() error {
	// Start the HTTP server
	webRoot := "./web/dist"
	port := "8080"

	srv := server.NewServer(port, webRoot)
	log.Printf("Starting HTTP server on port %s", port)

	return srv.Start()
}
