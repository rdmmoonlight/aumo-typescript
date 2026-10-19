// Package handlers berisi seluruh endpoint HTTP layanan auth.
package handlers

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/app/monorepo/services/auth/pkg/password"
	"github.com/app/monorepo/services/auth/pkg/store"
	"github.com/app/monorepo/services/auth/pkg/tokens"
)

const (
	SessionCookie = "auth_session"
	stateCookie   = "oauth_state"
	clientCookie  = "oauth_client"

	HeaderUserID    = "X-User-Id"
	HeaderUserEmail = "X-User-Email"

	maxBodyBytes = 1 << 20
)

// Config memuat seluruh pengaturan layanan. Endpoint Google dapat diganti
// agar alur OAuth bisa diuji tanpa jaringan.
type Config struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	GoogleAuthURL      string
	GoogleTokenURL     string
	GoogleUserInfoURL  string

	FrontendURL    string
	AllowedOrigins []string
	CookieSecure   bool
	SessionTTL     time.Duration
	HTTPClient     *http.Client
}

type Handler struct {
	jwt   *tokens.JWTManager
	users *store.Store
	cfg   Config
}

func New(jwtMgr *tokens.JWTManager, users *store.Store, cfg Config) *Handler {
	if cfg.GoogleAuthURL == "" {
		cfg.GoogleAuthURL = "https://accounts.google.com/o/oauth2/v2/auth"
	}
	if cfg.GoogleTokenURL == "" {
		cfg.GoogleTokenURL = "https://oauth2.googleapis.com/token"
	}
	if cfg.GoogleUserInfoURL == "" {
		cfg.GoogleUserInfoURL = "https://www.googleapis.com/oauth2/v2/userinfo"
	}
	if cfg.GoogleRedirectURL == "" {
		cfg.GoogleRedirectURL = "http://localhost:8080/auth/google-callback"
	}
	if cfg.SessionTTL <= 0 {
		cfg.SessionTTL = 24 * time.Hour
	}
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = &http.Client{Timeout: 10 * time.Second}
	}
	return &Handler{jwt: jwtMgr, users: users, cfg: cfg}
}

// Routes mendaftarkan semua endpoint dan membungkusnya dengan CORS.
func (h *Handler) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", h.Healthz)
	mux.HandleFunc("/auth/register", h.Register)
	mux.HandleFunc("/auth/login", h.Login)
	mux.HandleFunc("/auth/logout", h.Logout)
	mux.HandleFunc("/auth/validate", h.Validate)
	mux.HandleFunc("/auth/me", h.Me)
	mux.HandleFunc("/auth/google-login", h.GoogleLogin)
	mux.HandleFunc("/auth/google-callback", h.GoogleCallback)
	return h.cors(mux)
}

// ---------------------------------------------------------------------------
// Tipe request/response
// ---------------------------------------------------------------------------

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Client   string `json:"client"` // "web" (cookie) atau "mobile" (token di body)
}

type AuthResponse struct {
	Message string      `json:"message"`
	Token   string      `json:"token,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type googleUser struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("gagal menulis respons: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, AuthResponse{Message: msg})
}

func decodeBody(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return false
	}
	return true
}

func randomToken(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err) // kegagalan CSPRNG tidak dapat dipulihkan
	}
	return hex.EncodeToString(b)
}

func (h *Handler) setSession(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookie,
		Value:    token,
		Expires:  time.Now().Add(h.cfg.SessionTTL),
		MaxAge:   int(h.cfg.SessionTTL.Seconds()),
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})
}

func (h *Handler) clearCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})
}

func (h *Handler) extractToken(r *http.Request) string {
	if authHeader := r.Header.Get("Authorization"); strings.HasPrefix(authHeader, "Bearer ") {
		if t := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer ")); t != "" {
			return t
		}
	}
	if cookie, err := r.Cookie(SessionCookie); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	return ""
}

func (h *Handler) authenticate(r *http.Request) (*tokens.Claims, error) {
	tok := h.extractToken(r)
	if tok == "" {
		return nil, errors.New("token tidak ada")
	}
	return h.jwt.ValidateToken(tok)
}

func isMobile(client string) bool {
	return strings.EqualFold(strings.TrimSpace(client), "mobile")
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

func (h *Handler) originAllowed(origin string) bool {
	origin = strings.TrimRight(origin, "/")
	for _, o := range h.cfg.AllowedOrigins {
		if strings.EqualFold(strings.TrimRight(o, "/"), origin) {
			return true
		}
	}
	return false
}

func (h *Handler) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); origin != "" {
			w.Header().Add("Vary", "Origin")
			if h.originAllowed(origin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ---------------------------------------------------------------------------
// Endpoint standar
// ---------------------------------------------------------------------------

func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var req RegisterRequest
	if !decodeBody(w, r, &req) {
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	switch {
	case len([]rune(req.Name)) < 2:
		writeError(w, http.StatusBadRequest, "Nama minimal 2 karakter")
		return
	case !strings.Contains(req.Email, "@") || len(req.Email) > 254:
		writeError(w, http.StatusBadRequest, "Email tidak valid")
		return
	case len(req.Password) < 8 || len(req.Password) > 128:
		writeError(w, http.StatusBadRequest, "Kata sandi harus 8 sampai 128 karakter")
		return
	}

	hash, err := password.Hash(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal memproses kata sandi")
		return
	}
	user, err := h.users.Create(req.Name, req.Email, hash)
	if errors.Is(err, store.ErrEmailTaken) {
		writeError(w, http.StatusConflict, "Email sudah terdaftar")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Gagal mendaftarkan pengguna")
		return
	}
	writeJSON(w, http.StatusCreated, AuthResponse{Message: "Registration successful", Data: user})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var req LoginRequest
	if !decodeBody(w, r, &req) {
		return
	}

	const invalid = "Email atau kata sandi salah"
	user, err := h.users.FindByEmail(req.Email)
	if err != nil || user.PasswordHash == "" {
		writeError(w, http.StatusUnauthorized, invalid)
		return
	}
	ok, err := password.Verify(req.Password, user.PasswordHash)
	if err != nil || !ok {
		writeError(w, http.StatusUnauthorized, invalid)
		return
	}

	tokenStr, err := h.jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	if isMobile(req.Client) {
		writeJSON(w, http.StatusOK, AuthResponse{Message: "Mobile login successful", Token: tokenStr, Data: user})
		return
	}
	h.setSession(w, tokenStr)
	writeJSON(w, http.StatusOK, AuthResponse{Message: "Web login successful", Data: user})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	h.clearCookie(w, SessionCookie)
	writeJSON(w, http.StatusOK, AuthResponse{Message: "Logout successful"})
}

// Validate dipakai nginx (auth_request) dan layanan lain. Bila token sah,
// identitas dikembalikan lewat header X-User-Id dan X-User-Email.
func (h *Handler) Validate(w http.ResponseWriter, r *http.Request) {
	claims, err := h.authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized: invalid or missing token")
		return
	}
	w.Header().Set(HeaderUserID, claims.UserID)
	w.Header().Set(HeaderUserEmail, claims.Email)
	writeJSON(w, http.StatusOK, claims)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	claims, err := h.authenticate(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	writeJSON(w, http.StatusOK, AuthResponse{Message: "User profile fetched successfully", Data: claims})
}

// ---------------------------------------------------------------------------
// Google OAuth2 (tanpa dependensi eksternal)
// ---------------------------------------------------------------------------

func (h *Handler) googleEnabled() bool {
	return h.cfg.GoogleClientID != "" && h.cfg.GoogleClientSecret != ""
}

func (h *Handler) shortCookie(name, value string) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		MaxAge:   600,
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	}
}

func (h *Handler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	if !h.googleEnabled() {
		writeError(w, http.StatusServiceUnavailable, "Login Google belum dikonfigurasi")
		return
	}

	client := "web"
	if isMobile(r.URL.Query().Get("client")) {
		client = "mobile"
	}
	state := randomToken(16)
	http.SetCookie(w, h.shortCookie(stateCookie, state))
	http.SetCookie(w, h.shortCookie(clientCookie, client))

	q := url.Values{}
	q.Set("client_id", h.cfg.GoogleClientID)
	q.Set("redirect_uri", h.cfg.GoogleRedirectURL)
	q.Set("response_type", "code")
	q.Set("scope", "openid email profile")
	q.Set("state", state)
	q.Set("access_type", "offline")
	http.Redirect(w, r, h.cfg.GoogleAuthURL+"?"+q.Encode(), http.StatusTemporaryRedirect)
}

func (h *Handler) exchangeCode(code string) (string, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", h.cfg.GoogleClientID)
	form.Set("client_secret", h.cfg.GoogleClientSecret)
	form.Set("redirect_uri", h.cfg.GoogleRedirectURL)
	form.Set("grant_type", "authorization_code")

	resp, err := h.cfg.HTTPClient.PostForm(h.cfg.GoogleTokenURL, form)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", errors.New("Google menolak kode otorisasi")
	}
	var body struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil || body.AccessToken == "" {
		return "", errors.New("respons token Google tidak valid")
	}
	return body.AccessToken, nil
}

func (h *Handler) fetchGoogleUser(accessToken string) (*googleUser, error) {
	req, err := http.NewRequest(http.MethodGet, h.cfg.GoogleUserInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := h.cfg.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("Google menolak permintaan profil")
	}
	var u googleUser
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (h *Handler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	if !h.googleEnabled() {
		writeError(w, http.StatusServiceUnavailable, "Login Google belum dikonfigurasi")
		return
	}

	// 1. Validasi state CSRF: harus sama dengan nilai di cookie milik peramban ini.
	sc, err := r.Cookie(stateCookie)
	state := r.URL.Query().Get("state")
	if err != nil || state == "" || subtle.ConstantTimeCompare([]byte(sc.Value), []byte(state)) != 1 {
		writeError(w, http.StatusBadRequest, "Invalid OAuth state")
		return
	}
	client := "web"
	if cc, err := r.Cookie(clientCookie); err == nil && isMobile(cc.Value) {
		client = "mobile"
	}
	h.clearCookie(w, stateCookie)
	h.clearCookie(w, clientCookie)

	code := r.URL.Query().Get("code")
	if code == "" {
		writeError(w, http.StatusBadRequest, "Kode otorisasi tidak ada")
		return
	}

	// 2. Tukar kode, ambil profil.
	accessToken, err := h.exchangeCode(code)
	if err != nil {
		log.Printf("google exchange: %v", err)
		writeError(w, http.StatusBadGateway, "Gagal menukar kode dengan Google")
		return
	}
	gu, err := h.fetchGoogleUser(accessToken)
	if err != nil {
		log.Printf("google userinfo: %v", err)
		writeError(w, http.StatusBadGateway, "Gagal mengambil profil Google")
		return
	}
	if gu.Email == "" || !gu.VerifiedEmail {
		writeError(w, http.StatusForbidden, "Email Google belum terverifikasi")
		return
	}

	// 3. Buat/ambil pengguna lokal, terbitkan JWT internal.
	user := h.users.UpsertExternal("", gu.Name, gu.Email)
	tokenStr, err := h.jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate session token")
		return
	}

	if client == "web" {
		h.setSession(w, tokenStr)
		if h.cfg.FrontendURL != "" {
			http.Redirect(w, r, h.cfg.FrontendURL, http.StatusFound)
			return
		}
		writeJSON(w, http.StatusOK, AuthResponse{Message: "Google login successful", Data: user})
		return
	}
	writeJSON(w, http.StatusOK, AuthResponse{Message: "Google login successful", Token: tokenStr, Data: user})
}
