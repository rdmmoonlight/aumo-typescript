// Package store menyimpan pengguna di memori proses.
// Data hilang saat layanan restart; ganti dengan database untuk produksi.
package store

import (
	"crypto/rand"
	"errors"
	"fmt"
	"strings"
	"sync"
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

type Store struct {
	mu      sync.RWMutex
	byEmail map[string]*User
}

func New() *Store {
	return &Store{byEmail: make(map[string]*User)}
}

func normalize(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func newID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func (s *Store) Create(name, email, passwordHash string) (*User, error) {
	key := normalize(email)
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.byEmail[key]; ok {
		return nil, ErrEmailTaken
	}
	u := &User{ID: newID(), Name: name, Email: key, PasswordHash: passwordHash}
	s.byEmail[key] = u
	return u, nil
}

func (s *Store) FindByEmail(email string) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.byEmail[normalize(email)]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

// UpsertExternal dipakai login Google: membuat pengguna bila belum ada.
func (s *Store) UpsertExternal(id, name, email string) *User {
	key := normalize(email)
	s.mu.Lock()
	defer s.mu.Unlock()
	if u, ok := s.byEmail[key]; ok {
		return u
	}
	if id == "" {
		id = newID()
	}
	u := &User{ID: id, Name: name, Email: key}
	s.byEmail[key] = u
	return u
}
