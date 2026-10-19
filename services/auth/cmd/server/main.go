package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/app/monorepo/services/auth/pkg/tokens"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type AuthHandler struct {
	jwtManager   *tokens.JWTManager
	googleConfig *oauth2.Config
}

type GoogleUser struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Client   string `json:"client"` // "web" atau "mobile"
}

type AuthResponse struct {
	Message string      `json:"message"`
	Token   string      `json:"token,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// Random string acak sederhana untuk keamanan state CSRF
const oauthStateString = "random-csrf-state-token"

func NewAuthHandler(jwtMgr *tokens.JWTManager) *AuthHandler {
	// Membaca kredensial Google dari Environment Variables
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")

	if redirectURL == "" {
		redirectURL = "http://localhost:8080/auth/google-callback"
	}

	gConfig := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return &AuthHandler{
		jwtManager:   jwtMgr,
		googleConfig: gConfig,
	}
}

func (h *AuthHandler) extractToken(r *http.Request) string {
	if cookie, err := r.Cookie("auth_session"); err == nil && cookie.Value != "" {
		return cookie.Value
	}

	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}

	return ""
}

// -----------------------------------------------------------------------------
// 1. GOOGLE LOGIN (Redirect ke Consent Page Google)
// -----------------------------------------------------------------------------
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Tangkap tipe client (web / mobile) dari query parameter jika ada
	clientType := r.URL.Query().Get("client")
	if clientType == "" {
		clientType = "web"
	}

	// Simpan tipe client di Cookie sementara untuk dibaca saat callback
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_client",
		Value:    clientType,
		Expires:  time.Now().Add(10 * time.Minute),
		HttpOnly: true,
		Path:     "/",
	})

	url := h.googleConfig.AuthCodeURL(oauthStateString, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// -----------------------------------------------------------------------------
// 2. GOOGLE CALLBACK (Proses Token & Buat Session JWT)
// -----------------------------------------------------------------------------
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1. Validasi State CSRF
	state := r.FormValue("state")
	if state != oauthStateString {
		http.Error(w, "Invalid OAuth state", http.StatusBadRequest)
		return
	}

	// 2. Tukar Code dengan OAuth2 Token
	code := r.FormValue("code")
	token, err := h.googleConfig.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange code for token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// 3. Ambil Profile User dari Google API
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		http.Error(w, "Failed to fetch user info from Google", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var gUser GoogleUser
	if err := json.NewDecoder(resp.Body).Decode(&gUser); err != nil {
		http.Error(w, "Failed to decode Google user info", http.StatusInternalServerError)
		return
	}

	// TODO: Cek apakah user sudah ada di DB. Jika belum ada, lakukan auto-register.
	log.Printf("Google Auth Success for User: %s (%s)", gUser.Name, gUser.Email)

	// 4. Generate JWT internal aplikasi kita
	tokenStr, err := h.jwtManager.GenerateToken(gUser.ID, gUser.Email)
	if err != nil {
		http.Error(w, "Failed to generate session token", http.StatusInternalServerError)
		return
	}

	// Cek tipe client dari cookie yang disimpan saat /google-login
	clientType := "web"
	if cookie, err := r.Cookie("oauth_client"); err == nil && cookie.Value != "" {
		clientType = cookie.Value
	}

	w.Header().Set("Content-Type", "application/json")

	// Respon Skenario Web (Cookie)
	if clientType == "web" {
		http.SetCookie(w, &http.Cookie{
			Name:     "auth_session",
			Value:    tokenStr,
			Expires:  time.Now().Add(24 * time.Hour),
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})

		// Redirect langsung ke dashboard frontend jika dibutuhkan, atau kirim respon JSON
		json.NewEncoder(w).Encode(AuthResponse{
			Message: "Google login successful",
			Data:    gUser,
		})
		return
	}

	// Respon Skenario Mobile (Token Payload)
	json.NewEncoder(w).Encode(AuthResponse{
		Message: "Google login successful",
		Token:   tokenStr,
		Data:    gUser,
	})
}

// -----------------------------------------------------------------------------
// RUTE LAINNYA (Register, Login, Logout, Validate, Me)
// -----------------------------------------------------------------------------

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AuthResponse{Message: "Registration successful"})
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

	userID := "123e4567-e89b-12d3-a456-426614174000"
	tokenStr, err := h.jwtManager.GenerateToken(userID, req.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if req.Client == "web" {
		http.SetCookie(w, &http.Cookie{
			Name:     "auth_session",
			Value:    tokenStr,
			Expires:  time.Now().Add(24 * time.Hour),
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			Path:     "/",
		})
		json.NewEncoder(w).Encode(AuthResponse{Message: "Web login successful"})
		return
	}

	json.NewEncoder(w).Encode(AuthResponse{
		Message: "Mobile login successful",
		Token:   tokenStr,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_session",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{Message: "Logout successful"})
}

func (h *AuthHandler) Validate(w http.ResponseWriter, r *http.Request) {
	tokenStr := h.extractToken(r)
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

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tokenStr := h.extractToken(r)
	if tokenStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	claims, err := h.jwtManager.ValidateToken(tokenStr)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Message: "User profile fetched successfully",
		Data:    claims,
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	jwtKey := os.Getenv("JWT_SECRET")
	if jwtKey == "" {
		jwtKey = "super-secret-key-32-bytes-long!"
	}

	jwtMgr := tokens.NewJWTManager(jwtKey, 24*time.Hour)
	handler := NewAuthHandler(jwtMgr)

	mux := http.NewServeMux()

	// Endpoints Standar
	mux.HandleFunc("/auth/register", handler.Register)
	mux.HandleFunc("/auth/login", handler.Login)
	mux.HandleFunc("/auth/logout", handler.Logout)
	mux.HandleFunc("/auth/validate", handler.Validate)
	mux.HandleFunc("/auth/me", handler.Me)

	// Endpoints Google OAuth2
	mux.HandleFunc("/auth/google-login", handler.GoogleLogin)
	mux.HandleFunc("/auth/google-callback", handler.GoogleCallback)

	port := ":8080"
	fmt.Printf("Auth service listening on port %s...\n", port)
	if err := http.ListenAndServe(port, corsMiddleware(mux)); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}