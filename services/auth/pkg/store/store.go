// Package store mendefinisikan penyimpanan pengguna layanan auth.
// Implementasi produksi adalah PostgreSQL (postgres.go). MemoryStore hanya
// untuk tes dan tidak dipakai oleh cmd/server.
package store

import (
	"context"
	"errors"
	"strings"
)

var (
	ErrEmailTaken = errors.New("email sudah terdaftar")
	ErrNotFound   = errors.New("pengguna tidak ditemukan")
)

type User struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	PasswordHash string `json:"-"`
}

// Store adalah kontrak penyimpanan pengguna.
type Store interface {
	// Create membuat pengguna berkata sandi. ErrEmailTaken bila email sudah ada.
	Create(ctx context.Context, name, email, passwordHash string) (*User, error)
	// FindByEmail mengembalikan ErrNotFound bila tidak ada.
	FindByEmail(ctx context.Context, email string) (*User, error)
	// UpsertExternal dipakai login Google: membuat pengguna bila belum ada.
	UpsertExternal(ctx context.Context, name, email string) (*User, error)
}

func normalize(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
