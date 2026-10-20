package store

import (
	"context"
	"os"
	"sync"
	"testing"
	"time"
)

// Tes ini memakai Postgres sungguhan: set TEST_DATABASE_URL untuk menjalankannya.
func openTest(t *testing.T) *Postgres {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL tidak diset; tes Postgres dilewati")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pg, err := OpenPostgres(ctx, dsn)
	if err != nil {
		t.Fatalf("OpenPostgres: %v", err)
	}
	t.Cleanup(func() {
		_, _ = pg.db.Exec(`TRUNCATE auth.users`)
		_ = pg.Close()
	})
	if _, err := pg.db.Exec(`TRUNCATE auth.users`); err != nil {
		t.Fatal(err)
	}
	return pg
}

func TestPostgresCreateFindAndNormalize(t *testing.T) {
	pg := openTest(t)
	ctx := context.Background()
	u, err := pg.Create(ctx, "Ghofur", "  Ghofur@Example.COM ", "hash-1")
	if err != nil {
		t.Fatal(err)
	}
	if u.Email != "ghofur@example.com" {
		t.Fatalf("email harus dinormalisasi, dapat %q", u.Email)
	}
	got, err := pg.FindByEmail(ctx, "GHOFUR@example.com")
	if err != nil || got.ID != u.ID || got.PasswordHash != "hash-1" {
		t.Fatalf("FindByEmail: %+v err=%v", got, err)
	}
	if _, err := pg.FindByEmail(ctx, "tidak@ada.io"); err != ErrNotFound {
		t.Fatalf("harus ErrNotFound, dapat %v", err)
	}
}

func TestPostgresDuplicateEmail(t *testing.T) {
	pg := openTest(t)
	ctx := context.Background()
	if _, err := pg.Create(ctx, "A", "dup@example.com", "h"); err != nil {
		t.Fatal(err)
	}
	if _, err := pg.Create(ctx, "B", "DUP@example.com", "h"); err != ErrEmailTaken {
		t.Fatalf("harus ErrEmailTaken, dapat %v", err)
	}
}

func TestPostgresConcurrentDuplicateOnlyOneWins(t *testing.T) {
	pg := openTest(t)
	ctx := context.Background()
	var wg sync.WaitGroup
	var mu sync.Mutex
	ok, taken := 0, 0
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := pg.Create(ctx, "X", "race@example.com", "h")
			mu.Lock()
			defer mu.Unlock()
			switch err {
			case nil:
				ok++
			case ErrEmailTaken:
				taken++
			default:
				t.Errorf("galat tak terduga: %v", err)
			}
		}()
	}
	wg.Wait()
	if ok != 1 || taken != 7 {
		t.Fatalf("ok=%d taken=%d, harapan 1 dan 7", ok, taken)
	}
}

func TestPostgresUpsertExternalIdempotent(t *testing.T) {
	pg := openTest(t)
	ctx := context.Background()
	a, err := pg.UpsertExternal(ctx, "Gee", "g@example.com")
	if err != nil {
		t.Fatal(err)
	}
	b, err := pg.UpsertExternal(ctx, "Nama Lain", "G@Example.com")
	if err != nil || b.ID != a.ID || b.Name != "Gee" {
		t.Fatalf("upsert kedua harus mengembalikan pengguna yang sama: %+v err=%v", b, err)
	}
	if a.PasswordHash != "" {
		t.Fatal("pengguna Google tidak memiliki kata sandi")
	}
}

func TestMigrationIsRepeatable(t *testing.T) {
	pg := openTest(t)
	ctx := context.Background()
	if _, err := pg.db.ExecContext(ctx, migrateSQL); err != nil {
		t.Fatalf("migrasi kedua harus aman: %v", err)
	}
}

func TestOpenPostgresRejectsEmptyDSN(t *testing.T) {
	if _, err := OpenPostgres(context.Background(), ""); err == nil {
		t.Fatal("DSN kosong harus ditolak")
	}
}
