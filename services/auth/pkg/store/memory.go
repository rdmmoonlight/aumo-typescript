package store

import (
	"context"
	"sync"
)

// MemoryStore adalah implementasi dalam memori untuk tes unit.
// Jangan dipakai di cmd/server: data hilang saat restart.
type MemoryStore struct {
	mu      sync.RWMutex
	byEmail map[string]*User
}

func NewMemory() *MemoryStore {
	return &MemoryStore{byEmail: make(map[string]*User)}
}

func (s *MemoryStore) Create(_ context.Context, name, email, passwordHash string) (*User, error) {
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

func (s *MemoryStore) FindByEmail(_ context.Context, email string) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.byEmail[normalize(email)]
	if !ok {
		return nil, ErrNotFound
	}
	return u, nil
}

func (s *MemoryStore) UpsertExternal(_ context.Context, name, email string) (*User, error) {
	key := normalize(email)
	s.mu.Lock()
	defer s.mu.Unlock()
	if u, ok := s.byEmail[key]; ok {
		return u, nil
	}
	u := &User{ID: newID(), Name: name, Email: key}
	s.byEmail[key] = u
	return u, nil
}
