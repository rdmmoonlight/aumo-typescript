package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/app/monorepo/services/auth/pkg/store"
	"github.com/app/monorepo/services/auth/pkg/tokens"
)

type settingsEnv struct {
	h     http.Handler
	users *store.MemoryStore
	token string
}

// newSettingsEnv mendaftar dan login (mobile) satu pengguna, lalu mengembalikan token Bearer-nya.
func newSettingsEnv(t *testing.T) *settingsEnv {
	t.Helper()
	users := store.NewMemory()
	h := New(tokens.NewJWTManager(secret, time.Hour), users, Config{AllowedOrigins: []string{"http://localhost:3000"}}).Routes()
	register(t, h)
	rec := do(h, "POST", "/auth/login", `{"email":"ghofur@example.com","password":"rahasia-123","client":"mobile"}`, nil)
	var out struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil || out.Token == "" {
		t.Fatalf("login mobile gagal: %d %s", rec.Code, rec.Body)
	}
	return &settingsEnv{h: h, users: users, token: out.Token}
}

func (e *settingsEnv) call(method, path, body string) *httptest.ResponseRecorder {
	return do(e.h, method, path, body, map[string]string{"Authorization": "Bearer " + e.token, "Content-Type": "application/json"})
}

func parse(t *testing.T, rec *httptest.ResponseRecorder) settingsResponse {
	t.Helper()
	var r settingsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &r); err != nil {
		t.Fatalf("respons bukan JSON: %v: %s", err, rec.Body)
	}
	return r
}

func (e *settingsEnv) user(t *testing.T) *store.User {
	t.Helper()
	u, err := e.users.FindByEmail(nil, "ghofur@example.com") //nolint:staticcheck // MemoryStore tidak memakai ctx
	if err != nil {
		t.Fatal(err)
	}
	return u
}

func TestSettingsRequireAuth(t *testing.T) {
	e := newSettingsEnv(t)
	for _, c := range []struct{ method, path string }{
		{"PUT", "/settings/profile"}, {"POST", "/settings/change-password"}, {"DELETE", "/settings/delete-account"},
	} {
		rec := do(e.h, c.method, c.path, `{}`, nil)
		if rec.Code != 401 {
			t.Fatalf("%s %s tanpa token = %d, harus 401", c.method, c.path, rec.Code)
		}
		if r := parse(t, rec); r.Success || r.Message != "Unauthorized" {
			t.Fatalf("%s %s: %+v", c.method, c.path, r)
		}
	}
}

func TestSettingsRejectWrongMethod(t *testing.T) {
	e := newSettingsEnv(t)
	for _, c := range []struct{ method, path string }{
		{"GET", "/settings/profile"}, {"POST", "/settings/profile"}, {"PUT", "/settings/change-password"}, {"POST", "/settings/delete-account"},
	} {
		if rec := e.call(c.method, c.path, `{}`); rec.Code != 405 {
			t.Fatalf("%s %s = %d, harus 405", c.method, c.path, rec.Code)
		}
	}
}

func TestUpdateProfileSavesFields(t *testing.T) {
	e := newSettingsEnv(t)
	rec := e.call("PUT", "/settings/profile",
		`{"fullName":"Tri Wahyu","userName":"ghofur_01","phoneNumber":" +62 812-3456 ","bio":"Akuntan","avatarUrl":"https://aumo.test/api/avatars/a.png"}`)
	if rec.Code != 200 {
		t.Fatalf("= %d: %s", rec.Code, rec.Body)
	}
	if r := parse(t, rec); !r.Success || r.Message != "Profile updated successfully." {
		t.Fatalf("%+v", r)
	}
	u := e.user(t)
	if u.Name != "Tri Wahyu" || u.UserName != "ghofur_01" || u.PhoneNumber != "+62 812-3456" || u.Bio != "Akuntan" ||
		u.AvatarURL != "https://aumo.test/api/avatars/a.png" {
		t.Fatalf("profil tidak tersimpan: %+v", u)
	}
}

func TestUpdateProfileBlankFieldsFollowSourceRules(t *testing.T) {
	e := newSettingsEnv(t)
	e.call("PUT", "/settings/profile", `{"fullName":"Tri Wahyu","phoneNumber":"+6281234","bio":"x","avatarUrl":"https://a.test/x.png"}`)
	// Nama dan avatar kosong: tidak diubah. Telepon dan bio kosong: dihapus.
	rec := e.call("PUT", "/settings/profile", `{"fullName":"  ","phoneNumber":"","bio":"","avatarUrl":""}`)
	if rec.Code != 200 {
		t.Fatalf("= %d: %s", rec.Code, rec.Body)
	}
	u := e.user(t)
	if u.Name != "Tri Wahyu" || u.AvatarURL != "https://a.test/x.png" {
		t.Fatalf("nama dan avatar harus tetap: %+v", u)
	}
	if u.PhoneNumber != "" || u.Bio != "" {
		t.Fatalf("telepon dan bio harus terhapus: %+v", u)
	}
}

func TestUpdateProfileValidation(t *testing.T) {
	e := newSettingsEnv(t)
	cases := []struct{ name, body, want string }{
		{"nama terlalu panjang", `{"fullName":"` + strings.Repeat("a", 101) + `"}`, "Full name must not exceed 100 characters."},
		{"username terlalu panjang", `{"userName":"` + strings.Repeat("a", 257) + `"}`, "Username must not exceed 256 characters."},
		{"telepon tidak valid", `{"phoneNumber":"abc"}`, "Phone number format is invalid."},
		{"bio terlalu panjang", `{"bio":"` + strings.Repeat("a", 501) + `"}`, "Bio must not exceed 500 characters."},
		{"avatar bukan URL", `{"avatarUrl":"bukan-url"}`, "Avatar URL must be a valid http or https address."},
		{"avatar skema berbahaya", `{"avatarUrl":"javascript:alert(1)"}`, "Avatar URL must be a valid http or https address."},
		{"avatar tanpa host", `{"avatarUrl":"https://"}`, "Avatar URL must be a valid http or https address."},
		{"avatar terlalu panjang", `{"avatarUrl":"https://a.test/` + strings.Repeat("a", 2048) + `"}`, "Avatar URL is too long."},
	}
	for _, c := range cases {
		rec := e.call("PUT", "/settings/profile", c.body)
		r := parse(t, rec)
		if rec.Code != 400 || r.Success || r.Message != c.want || len(r.Errors) == 0 || r.Errors[0] != c.want {
			t.Errorf("%s: %d %+v, harus 400 dengan %q", c.name, rec.Code, r, c.want)
		}
	}
	if rec := e.call("PUT", "/settings/profile", `bukan json`); rec.Code != 400 {
		t.Fatalf("JSON rusak harus 400, dapat %d", rec.Code)
	}
}

func TestUpdateProfileUserNameRules(t *testing.T) {
	e := newSettingsEnv(t)
	rec := e.call("PUT", "/settings/profile", `{"userName":"nama salah!"}`)
	if r := parse(t, rec); rec.Code != 400 || r.Message != "Username 'nama salah!' is invalid, can only contain letters or digits." {
		t.Fatalf("%d %+v", rec.Code, r)
	}
	// Pengguna lain mengambil username "budi".
	if _, err := e.users.Create(nil, "Budi", "budi@example.com", "h"); err != nil { //nolint:staticcheck
		t.Fatal(err)
	}
	budi, _ := e.users.FindByEmail(nil, "budi@example.com") //nolint:staticcheck
	n := "Budi"
	if _, err := e.users.UpdateProfile(nil, budi.ID, store.ProfileUpdate{UserName: &n}); err != nil { //nolint:staticcheck
		t.Fatal(err)
	}
	rec = e.call("PUT", "/settings/profile", `{"userName":"budi"}`)
	if r := parse(t, rec); rec.Code != 400 || r.Message != "Username 'budi' is already taken." {
		t.Fatalf("username ganda (tanpa membedakan huruf): %d %+v", rec.Code, r)
	}
	// Mengirim ulang username sendiri tidak dianggap bentrok.
	e.call("PUT", "/settings/profile", `{"userName":"ghofur"}`)
	if rec := e.call("PUT", "/settings/profile", `{"userName":"ghofur"}`); rec.Code != 200 {
		t.Fatalf("username sendiri harus lolos: %d %s", rec.Code, rec.Body)
	}
}

func TestChangePassword(t *testing.T) {
	e := newSettingsEnv(t)
	cases := []struct{ name, body, want string }{
		{"sandi lama kosong", `{"currentPassword":"","newPassword":"baru-12345"}`, "Current password is required."},
		{"sandi baru kosong", `{"currentPassword":"rahasia-123","newPassword":""}`, "New password is required."},
		{"sandi baru pendek", `{"currentPassword":"rahasia-123","newPassword":"pendek"}`, "New password must be at least 8 characters."},
		{"sandi baru terlalu panjang", `{"currentPassword":"rahasia-123","newPassword":"` + strings.Repeat("a", 129) + `"}`, "New password must not exceed 128 characters."},
		{"sandi baru sama", `{"currentPassword":"rahasia-123","newPassword":"rahasia-123"}`, "New password must be different from the current password."},
	}
	for _, c := range cases {
		rec := e.call("POST", "/settings/change-password", c.body)
		r := parse(t, rec)
		if rec.Code != 400 || r.Success || r.Message != c.want {
			t.Errorf("%s: %d %+v, harus 400 dengan %q", c.name, rec.Code, r, c.want)
		}
	}

	rec := e.call("POST", "/settings/change-password", `{"currentPassword":"salah-salah","newPassword":"baru-12345"}`)
	if r := parse(t, rec); rec.Code != 400 || r.Message != "Incorrect password." {
		t.Fatalf("sandi lama salah: %d %+v", rec.Code, r)
	}

	rec = e.call("POST", "/settings/change-password", `{"currentPassword":"rahasia-123","newPassword":"baru-12345"}`)
	if r := parse(t, rec); rec.Code != 200 || !r.Success || r.Message != "Password successfully updated." {
		t.Fatalf("= %d %+v", rec.Code, r)
	}
	if rec := do(e.h, "POST", "/auth/login", `{"email":"ghofur@example.com","password":"rahasia-123"}`, nil); rec.Code != 401 {
		t.Fatalf("sandi lama harus ditolak, dapat %d", rec.Code)
	}
	if rec := do(e.h, "POST", "/auth/login", `{"email":"ghofur@example.com","password":"baru-12345"}`, nil); rec.Code != 200 {
		t.Fatalf("sandi baru harus berhasil, dapat %d", rec.Code)
	}
}

func TestChangePasswordRejectsAccountWithoutPassword(t *testing.T) {
	e := newSettingsEnv(t)
	if _, err := e.users.UpsertExternal(nil, "Google User", "g@example.com"); err != nil { //nolint:staticcheck
		t.Fatal(err)
	}
	u, _ := e.users.FindByEmail(nil, "g@example.com") //nolint:staticcheck
	tok, _ := tokens.NewJWTManager(secret, time.Hour).GenerateToken(u.ID, u.Email)
	rec := do(e.h, "POST", "/settings/change-password", `{"currentPassword":"apa-saja-1","newPassword":"baru-12345"}`,
		map[string]string{"Authorization": "Bearer " + tok})
	if r := parse(t, rec); rec.Code != 400 || r.Message != "Incorrect password." {
		t.Fatalf("%d %+v", rec.Code, r)
	}
}

func TestDeleteAccount(t *testing.T) {
	e := newSettingsEnv(t)
	rec := e.call("DELETE", "/settings/delete-account", "")
	if r := parse(t, rec); rec.Code != 200 || !r.Success || r.Message != "Account successfully deleted." {
		t.Fatalf("= %d %+v", rec.Code, r)
	}
	cleared := false
	for _, c := range rec.Result().Cookies() {
		if c.Name == SessionCookie && c.MaxAge < 0 {
			cleared = true
		}
	}
	if !cleared {
		t.Fatal("cookie sesi harus dihapus")
	}
	if rec := do(e.h, "POST", "/auth/login", `{"email":"ghofur@example.com","password":"rahasia-123"}`, nil); rec.Code != 401 {
		t.Fatalf("login akun terhapus harus 401, dapat %d", rec.Code)
	}
	// Token lama masih sah secara kriptografis, tetapi akunnya sudah tidak ada.
	if rec := e.call("PUT", "/settings/profile", `{"bio":"x"}`); rec.Code != 401 {
		t.Fatalf("token akun terhapus harus 401, dapat %d", rec.Code)
	}
	if rec := e.call("DELETE", "/settings/delete-account", ""); rec.Code != 401 {
		t.Fatalf("hapus ulang harus 401, dapat %d", rec.Code)
	}
}

func TestCORSAllowsPutAndDeleteForSettings(t *testing.T) {
	e := newSettingsEnv(t)
	rec := do(e.h, "OPTIONS", "/settings/profile", "", map[string]string{"Origin": "http://localhost:3000"})
	got := rec.Header().Get("Access-Control-Allow-Methods")
	if !strings.Contains(got, "PUT") || !strings.Contains(got, "DELETE") {
		t.Fatalf("Allow-Methods = %q", got)
	}
}
