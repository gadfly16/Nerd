package server

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/golang-jwt/jwt/v5"
)

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
