package server

import (
	"context"
	"log"
	"net/http"

	"github.com/coder/websocket"
	"github.com/gadfly16/nerd/api"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
)

// handleWebSocket upgrades HTTP connection to WebSocket and creates GUI node
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Authenticate user from JWT
	userID, _, err := s.getUserFromJWT(r)
	if err != nil {
		log.Printf("WebSocket authentication failed: %v", err)
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}

	// Upgrade to WebSocket
	conn, err := websocket.Accept(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	log.Printf("WebSocket connected for user %d", userID)

	// Lookup the Clients group node under the user
	clientsTag, err := api.IAskLookup(userID, userID, "Clients")
	if err != nil {
		log.Printf("Failed to lookup Clients node: %v", err)
		conn.Close(websocket.StatusInternalError, "server error")
		return
	}

	// Create GUI node under Clients with WebSocket connection
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel() // Cleanup when handler exits

	guiSpec := msg.CreateGUIPayload{
		Conn:       conn,
		Ctx:        ctx,
		CancelFunc: cancel,
	}

	newgui, err := api.IAskCreateChild(clientsTag.ID, userID, nerd.GUINode, "", guiSpec)
	if err != nil {
		log.Printf("Failed to create GUI node: %v", err)
		conn.Close(websocket.StatusInternalError, "server error")
		return
	}

	log.Printf("Created GUI node %d (%s) for user %d", newgui.ID, newgui.Name, userID)

	// Wait for context to be done (connection closed)
	<-ctx.Done()

	log.Printf("Websocket context canceled for %d (%s)", newgui.ID, newgui.Name)

	err = api.IAskDeleteChild(clientsTag.ID, userID, newgui.Name)
	if err != nil {
		log.Printf("Failed to create GUI node: %v", err)
		conn.Close(websocket.StatusInternalError, "server error")
		return
	}

	log.Printf("WebSocket handler exiting for user %d", userID)
}
