package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/app/monorepo/services/auth/pkg/handlers"
	"github.com/app/monorepo/services/auth/pkg/store"
	"github.com/app/monorepo/services/auth/pkg/tokens"
)

func getenv(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func main() {
	env := getenv("ENV", "development")
	production := env == "production"

	jwtKey := os.Getenv("JWT_SECRET")
	if production && len(jwtKey) < 32 {
		log.Fatal("JWT_SECRET wajib diisi (minimal 32 karakter) saat ENV=production")
	}
	if jwtKey == "" {
		jwtKey = "dev-only-secret-do-not-use-in-production!"
		log.Println("PERINGATAN: JWT_SECRET kosong, memakai kunci pengembangan")
	}

	cookieSecure := production
	if v := strings.TrimSpace(os.Getenv("COOKIE_SECURE")); v != "" {
		cookieSecure = v == "true" || v == "1"
	}

	frontend := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	origins := []string{"http://localhost:3000", "https://aumoweb.onrender.com"}
	for _, o := range strings.Split(getenv("CORS_ORIGINS", frontend), ",") {
		if o = strings.TrimSpace(o); o != "" {
			origins = append(origins, o)
		}
	}

	h := handlers.New(
		tokens.NewJWTManager(jwtKey, 24*time.Hour),
		store.New(),
		handlers.Config{
			GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
			FrontendURL:        frontend,
			AllowedOrigins:     origins,
			CookieSecure:       cookieSecure,
			SessionTTL:         24 * time.Hour,
		},
	)

	addr := ":" + getenv("AUTH_PORT", "8080")
	srv := &http.Server{
		Addr:              addr,
		Handler:           h.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Printf("Auth service listening on %s (env=%s)", addr, env)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
