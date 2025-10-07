package server

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/imsg"
	"github.com/gadfly16/nerd/internal/tree"
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

	// Authentication endpoint (unauthenticated)
	mux.HandleFunc("/auth", s.handleAuth)

	// API endpoint for authenticated messages
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

	// TODO: Parse HTTP message and route to tree.AskNode()
	// TODO: Validate user has access to target node

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "API endpoint ready", "user_id": %d}`, userID)
}

// getUserFromJWT extracts and validates the user ID and admin flag from the JWT cookie
// Returns 0, false and an error if authentication fails
func (s *Server) getUserFromJWT(r *http.Request) (nerd.NodeID, bool, error) {
	// Get JWT from httpOnly cookie
	cookie, err := r.Cookie("nerd_token")
	if err != nil {
		return 0, false, fmt.Errorf("no auth cookie found")
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
		return 0, false, fmt.Errorf("invalid token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return 0, false, fmt.Errorf("invalid token claims")
	}

	// Get user_id from claims
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, false, fmt.Errorf("missing or invalid user_id in token")
	}

	// Get admin flag from claims
	admin, ok := claims["admin"].(bool)
	if !ok {
		return 0, false, fmt.Errorf("missing or invalid admin in token")
	}

	return nerd.NodeID(userIDFloat), admin, nil
}

// handleAuth processes unauthenticated operations (login, user creation)
func (s *Server) handleAuth(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse HTTP message
	var httpMsg imsg.IMsg
	if err := json.NewDecoder(r.Body).Decode(&httpMsg); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Route based on message type
	switch httpMsg.Type {
	case imsg.AuthenticateUser:
		s.handleAuthenticateUser(w, &httpMsg)
	case imsg.CreateUser:
		s.handleCreateUser(w, &httpMsg)
	case imsg.Logout:
		s.handleLogout(w)
	default:
		http.Error(w, "Invalid auth message type", http.StatusBadRequest)
	}
}

// handleAuthenticateUser processes user authentication
func (s *Server) handleAuthenticateUser(w http.ResponseWriter, m *imsg.IMsg) {
	// Send authentication request to Authenticator
	result, err := tree.AskAuth(*m)
	if err != nil {
		log.Printf("Authentication failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "authentication failed"})
		return
	}

	// Result is map[string]any with nodeId and admin fields
	resultMap := result.(map[string]any)
	userID := nerd.NodeID(resultMap["nodeId"].(float64))
	admin := resultMap["admin"].(bool)

	// Set JWT cookie
	if err := s.setJWTCookie(w, userID, admin); err != nil {
		log.Printf("Failed to set JWT cookie: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Return success with user info
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resultMap)
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

// setJWTCookie generates a JWT token and sets it as an HTTP-only cookie
func (s *Server) setJWTCookie(w http.ResponseWriter, userID nerd.NodeID, admin bool) error {
	// Create JWT claims
	claims := jwt.MapClaims{
		"user_id": float64(userID),
		"admin":   admin,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return fmt.Errorf("failed to sign token: %w", err)
	}

	// Set HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "nerd_token",
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteStrictMode,
		MaxAge:   86400, // 24 hours
	})

	return nil
}

// handleCreateUser processes user creation
func (s *Server) handleCreateUser(w http.ResponseWriter, m *imsg.IMsg) {
	// Send user creation request to Authenticator
	result, err := tree.AskAuth(*m)
	if err != nil {
		log.Printf("User creation failed: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Result is map[string]any with nodeId and admin fields
	resultMap := result.(map[string]any)
	userID := nerd.NodeID(resultMap["nodeId"].(float64))
	admin := resultMap["admin"].(bool)

	// Set JWT cookie (auto-login after registration)
	if err := s.setJWTCookie(w, userID, admin); err != nil {
		log.Printf("Failed to set JWT cookie: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Return success with user info
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resultMap)
}
