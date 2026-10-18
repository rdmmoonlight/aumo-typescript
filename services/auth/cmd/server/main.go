package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/app/monorepo/services/auth/pkg/tokens"
)

type AuthHandler struct {
	jwtManager *tokens.JWTManager
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Client   string `json:"client"` // "web" atau "mobile"
}

type LoginResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"` // Hanya diisi untuk client mobile
}

func NewAuthHandler(jwtMgr *tokens.JWTManager) *AuthHandler {
	return &AuthHandler{jwtManager: jwtMgr}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Simulasi validasi kredensial (Hubungkan ke DB/Contract user)
	userID := "123e4567-e89b-12d3-a456-426614174000"

	tokenStr, err := h.jwtManager.GenerateToken(userID, req.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Skenario 1: Client Web -> Secure HTTP-Only Cookie
	if req.Client == "web" {
		http.SetCookie(w, &http.Cookie{
			Name:     "auth_session",
			Value:    tokenStr,
			Expires:  time.Now().Add(24 * time.Hour),
			HttpOnly: true,
			Secure:   true, // True di environment produksi (HTTPS)
			SameSite: http.SameSiteStrictMode,
			Path:     "/",
		})

		json.NewEncoder(w).Encode(LoginResponse{Message: "Web login successful"})
		return
	}

	// Skenario 2: Client Mobile (Kotlin Android) -> Bearer JWT Token Payload
	json.NewEncoder(w).Encode(LoginResponse{
		Message: "Mobile login successful",
		Token:   tokenStr,
	})
}

func (h *AuthHandler) Validate(w http.ResponseWriter, r *http.Request) {
	var tokenStr string

	// 1. Cek dari Cookie (Web)
	if cookie, err := r.Cookie("auth_session"); err == nil {
		tokenStr = cookie.Value
	}

	// 2. Cek dari Header Authorization Bearer (Mobile)
	if tokenStr == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenStr == "" {
		http.Error(w, "Unauthorized: missing token or session cookie", http.StatusUnauthorized)
		return
	}

	claims, err := h.jwtManager.ValidateToken(tokenStr)
	if err != nil {
		http.Error(w, "Unauthorized: invalid or expired token", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(claims)
}

func main() {
	jwtMgr := tokens.NewJWTManager("super-secret-key-32-bytes-long!", 24*time.Hour)
	handler := NewAuthHandler(jwtMgr)

	http.HandleFunc("/auth/login", handler.Login)
	http.HandleFunc("/auth/validate", handler.Validate)

	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}
}
