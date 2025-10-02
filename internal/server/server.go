package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/golang-jwt/jwt/v5"
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

	// API endpoint for messages
	mux.HandleFunc("/api", s.handleAPI)

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
		// Get user ID from JWT, defaults to 0 if not authenticated
		userID, err := s.getUserFromJWT(r)
		if err != nil {
			log.Printf("No authenticated user, serving with userID=0: %v", err)
		}

		// Read and inject user ID into index.html
		indexPath := filepath.Join(s.webRoot, "index.html")
		htmlBytes, err := os.ReadFile(indexPath)
		if err != nil {
			http.Error(w, "Failed to read index.html", http.StatusInternalServerError)
			return
		}

		// Replace user ID placeholder in HTML
		htmlString := string(htmlBytes)
		modifiedHTML := strings.Replace(htmlString, "{{USER_ID}}", fmt.Sprintf("%d", userID), 1)

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(modifiedHTML))
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

	// Extract user ID from JWT
	userID, err := s.getUserFromJWT(r)
	if err != nil {
		log.Printf("Authentication failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprintf(w, `{"error": "authentication required"}`)
		return
	}

	// TODO: Parse HTTP message and route to tree.AskNode()
	// TODO: Validate user has access to target node

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "API endpoint ready", "user_id": %d}`, userID)
}

// getUserFromJWT extracts and validates the user ID from the JWT cookie
// Returns 0 and an error if authentication fails
func (s *Server) getUserFromJWT(r *http.Request) (nerd.NodeID, error) {
	// Get JWT from httpOnly cookie
	cookie, err := r.Cookie("nerd_token")
	if err != nil {
		return 0, fmt.Errorf("no auth cookie found")
	}

	// Parse and validate JWT
	token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return 0, fmt.Errorf("invalid token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, fmt.Errorf("invalid token claims")
	}

	// Get user_id from claims
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, fmt.Errorf("missing or invalid user_id in token")
	}

	return nerd.NodeID(userIDFloat), nil
}
