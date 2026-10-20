package store

import (
	"context"
	"crypto/rand"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/lib/pq"
)

// Skema "auth" terpisah dari "public" agar tidak bersinggungan dengan
// migrasi Drizzle milik apps/nest.
const migrateSQL = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
	id            uuid        PRIMARY KEY,
	name          text        NOT NULL,
	email         text        NOT NULL,
	password_hash text,
	created_at    timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT users_email_lower CHECK (email = lower(email))
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON auth.users (email);
`

type Postgres struct {
	db *sql.DB
}

// OpenPostgres membuka koneksi, menunggu database siap (Neon dapat
// membutuhkan beberapa detik saat cold start), lalu menjalankan migrasi.
func OpenPostgres(ctx context.Context, dsn string) (*Postgres, error) {
	if dsn == "" {
		return nil, errors.New("DATABASE_URL kosong")
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("buka database: %w", err)
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(5 * time.Minute)

	var lastErr error
	for attempt := 1; attempt <= 6; attempt++ {
		pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		lastErr = db.PingContext(pingCtx)
		cancel()
		if lastErr == nil {
			break
		}
		select {
		case <-ctx.Done():
			_ = db.Close()
			return nil, ctx.Err()
		case <-time.After(time.Duration(attempt) * time.Second):
		}
	}
	if lastErr != nil {
		_ = db.Close()
		return nil, fmt.Errorf("database tidak dapat dihubungi: %w", lastErr)
	}

	if _, err := db.ExecContext(ctx, migrateSQL); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("migrasi skema auth: %w", err)
	}
	return &Postgres{db: db}, nil
}

func (p *Postgres) Close() error { return p.db.Close() }

// Ping dipakai untuk pemeriksaan kesiapan.
func (p *Postgres) Ping(ctx context.Context) error { return p.db.PingContext(ctx) }

func newID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func (p *Postgres) Create(ctx context.Context, name, email, passwordHash string) (*User, error) {
	u := &User{ID: newID(), Name: name, Email: normalize(email), PasswordHash: passwordHash}
	_, err := p.db.ExecContext(ctx,
		`INSERT INTO auth.users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)`,
		u.ID, u.Name, u.Email, u.PasswordHash)
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		return nil, ErrEmailTaken
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (p *Postgres) FindByEmail(ctx context.Context, email string) (*User, error) {
	u := &User{}
	var hash sql.NullString
	err := p.db.QueryRowContext(ctx,
		`SELECT id, name, email, password_hash FROM auth.users WHERE email = $1`,
		normalize(email)).Scan(&u.ID, &u.Name, &u.Email, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.PasswordHash = hash.String
	return u, nil
}

func (p *Postgres) UpsertExternal(ctx context.Context, name, email string) (*User, error) {
	u := &User{}
	var hash sql.NullString
	// ON CONFLICT DO UPDATE no-op agar RETURNING selalu mengembalikan baris.
	err := p.db.QueryRowContext(ctx,
		`INSERT INTO auth.users (id, name, email) VALUES ($1, $2, $3)
		 ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
		 RETURNING id, name, email, password_hash`,
		newID(), name, normalize(email)).Scan(&u.ID, &u.Name, &u.Email, &hash)
	if err != nil {
		return nil, err
	}
	u.PasswordHash = hash.String
	return u, nil
}
