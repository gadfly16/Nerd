package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/coder/websocket"

	"github.com/gadfly16/nerd/api"
	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/tree"
	"github.com/gadfly16/nerd/sdk/msg"
)

// Server represents the HTTP server for the Nerd GUI and API
type Server struct {
	port      string
	webRoot   string
	jwtSecret string
}

// NewServer creates a new HTTP server instance
func NewServer(port, webRoot string) *Server {
	return &Server{
		port:      port,
		webRoot:   webRoot,
		jwtSecret: "nerd-dev-secret-change-in-production", // TODO: make configurable
	}
}

// Start begins serving HTTP requests
func (s *Server) Start() error {
	// Setup routes
	mux := http.NewServeMux()

	// Static file serving and root route
	mux.HandleFunc("/", s.handleRoot)

	// Authentication endpoint (unauthenticated)
	mux.HandleFunc("/auth", s.handleAuth)

	// API endpoint for authenticated messages
	mux.HandleFunc("/api", s.handleAPI)

	// WebSocket endpoint for real-time updates
	mux.HandleFunc("/ws", s.handleWebSocket)

	addr := ":" + s.port
	log.Printf("Starting Nerd HTTP server on %s", addr)
	log.Printf("Web root: %s", s.webRoot)

	return http.ListenAndServe(addr, mux)
}

// handleRoot serves the main index.html with user ID injection
func (s *Server) handleRoot(w http.ResponseWriter, r *http.Request) {
	// Only allow GET requests
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.URL.Path == "/" {
		// Get user ID and admin flag from JWT, defaults to 0/false if not authenticated
		userID, admin, err := s.getUserFromJWT(r)
		if err != nil {
			log.Printf("No authenticated user, serving with userID=0: %v", err)
		}

		// Read and inject user ID and admin flag into index.html
		indexPath := filepath.Join(s.webRoot, "index.html")
		htmlBytes, err := os.ReadFile(indexPath)
		if err != nil {
			http.Error(w, "Failed to read index.html", http.StatusInternalServerError)
			return
		}

		// Replace user info placeholder in HTML
		htmlString := string(htmlBytes)
		userInfo := fmt.Sprintf(`userid="%d" admin="%t"`, userID, admin)
		htmlString = strings.Replace(htmlString, "{{USER_INFO}}", userInfo, 1)

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(htmlString))
		return
	}

	// Serve other static files (gui.js, gui.js.map, etc.)
	filePath := filepath.Join(s.webRoot, r.URL.Path)
	http.ServeFile(w, r, filePath)
}

// handleAPI processes all message requests
func (s *Server) handleAPI(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// TODO: Add JWT authentication
	// TODO: Parse HTTP message and route to tree.AskNode()

	// Extract user ID and admin flag from JWT
	userID, _, err := s.getUserFromJWT(r)
	if err != nil {
		log.Printf("Authentication failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprintf(w, `{"error": "authentication required"}`)
		return
	}

	// Parse HTTP message
	var httpMsg imsg.IMsg
	if err := json.NewDecoder(r.Body).Decode(&httpMsg); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Set user context
	httpMsg.UserID = userID

	// TODO: Validate user has access to target node

	// Route to tree
	result, err := tree.IAsk(httpMsg)
	if err != nil {
		log.Printf("API request failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Return result
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// handleAuth processes unauthenticated operations (login, user creation)
func (s *Server) handleAuth(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse IMsg
	var im imsg.IMsg
	if err := json.NewDecoder(r.Body).Decode(&im); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Route based on message type
	switch im.Type {
	case imsg.AuthenticateUser:
		s.handleAuthenticateUser(w, &im)
	case imsg.CreateChild:
		s.handleCreateUser(w, &im)
	case imsg.Logout:
		s.handleLogout(w)
	default:
		http.Error(w, "Invalid auth message type", http.StatusBadRequest)
	}
}

// handleAuthenticateUser processes user authentication
func (s *Server) handleAuthenticateUser(w http.ResponseWriter, im *imsg.IMsg) {
	// Send authentication request to Authenticator
	result, err := tree.IAskAuth(*im)
	if err != nil {
		log.Printf("Authentication failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "authentication failed"})
		return
	}

	// Result is *imsg.ITag
	itag := result.(*imsg.ITag)
	userID := itag.ID
	admin := itag.Admin

	// Set JWT cookie
	if err := s.setJWTCookie(w, userID, admin); err != nil {
		log.Printf("Failed to set JWT cookie: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Return success with user info
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(itag)
}

// handleCreateUser processes user creation
func (s *Server) handleCreateUser(w http.ResponseWriter, m *imsg.IMsg) {
	// Send user creation request to Authenticator
	result, err := tree.IAskAuth(*m)
	if err != nil {
		log.Printf("User creation failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Result is *imsg.ITag
	uit := result.(*imsg.ITag)

	// Create Clients group under new user
	_, err = api.IAskCreateChild(uit.ID, uit.ID, nerd.GroupNode, "Clients", nil)
	if err != nil {
		panic("Couldn't create Clients group under new user.")
	}

	userID := uit.ID
	admin := uit.Admin

	// Set JWT cookie (auto-login after registration)
	if err := s.setJWTCookie(w, userID, admin); err != nil {
		log.Printf("Failed to set JWT cookie: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Return success with user info
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(uit)
}

// handleLogout clears the authentication cookie
func (s *Server) handleLogout(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "nerd_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "logged out"})
}

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
	ctx := r.Context()
	guiSpec := msg.CreateGUIPayload{
		Conn: conn,
		Ctx:  ctx,
	}

	guiTag, err := api.IAskCreateChild(clientsTag.ID, userID, nerd.GUINode, "", guiSpec)
	if err != nil {
		log.Printf("Failed to create GUI node: %v", err)
		conn.Close(websocket.StatusInternalError, "server error")
		return
	}

	log.Printf("Created GUI node %d for user %d", guiTag.ID, userID)

	// Read loop to detect client disconnect
	// We expect no messages from client (server-to-client only)
	for {
		_, _, err := conn.Read(ctx)
		if err != nil {
			log.Printf("WebSocket connection closed for user %d: %v", userID, err)
			break
		}
	}
	conn.Close(websocket.StatusNormalClosure, "")
}
