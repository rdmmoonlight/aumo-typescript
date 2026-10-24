package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/app/monorepo/services/auth/pkg/password"
	"github.com/app/monorepo/services/auth/pkg/store"
)

// Endpoint settings milik Go karena mengubah auth.users (padanan SettingsController sumber .NET):
//   PUT    /settings/profile
//   POST   /settings/change-password
//   DELETE /settings/delete-account
// Unggah avatar dilayani Nest (POST /settings/avatar); klien menyimpan URL-nya lewat PUT /settings/profile.

const (
	maxFullNameLen    = 100
	maxUserNameLen    = 256
	maxBioLen         = 500
	maxAvatarURLLen   = 2048
	maxPasswordLen    = 128
	minNewPasswordLen = 8 // sama dengan kebijakan /auth/register
)

var (
	// Digit, spasi, +, -, titik, dan tanda kurung; 5-20 karakter (UpdateProfileRequestValidator).
	phoneRe = regexp.MustCompile(`^\+?[0-9\s\-().]{5,20}$`)
	// Karakter yang diizinkan ASP.NET Identity untuk UserName.
	userNameRe = regexp.MustCompile(`^[A-Za-z0-9\-._@+]+$`)
)

// settingsResponse: { success, message, errors? } seperti ToErrorResponse sumber.
type settingsResponse struct {
	Success bool     `json:"success"`
	Message string   `json:"message"`
	Errors  []string `json:"errors,omitempty"`
}

type updateProfileRequest struct {
	FullName    string `json:"fullName"`
	UserName    string `json:"userName"`
	PhoneNumber string `json:"phoneNumber"`
	Bio         string `json:"bio"`
	AvatarURL   string `json:"avatarUrl"`
}

type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

func settingsOK(w http.ResponseWriter, msg string) {
	writeJSON(w, http.StatusOK, settingsResponse{Success: true, Message: msg})
}

func settingsFail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, settingsResponse{Message: msg})
}

// settingsValidation: pesan pertama menjadi message, seluruh pesan unik menjadi errors.
func settingsValidation(w http.ResponseWriter, errs []string) {
	seen := map[string]bool{}
	var unique []string
	for _, e := range errs {
		if !seen[e] {
			seen[e] = true
			unique = append(unique, e)
		}
	}
	writeJSON(w, http.StatusBadRequest, settingsResponse{Message: unique[0], Errors: unique})
}

func decodeSettingsBody(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		settingsFail(w, http.StatusBadRequest, "Invalid request body")
		return false
	}
	return true
}

// currentUser mengautentikasi permintaan dan memuat pengguna. Token sah milik akun yang sudah
// dihapus ditolak (401), sehingga akun terhapus tidak bisa memakai endpoint settings lagi.
func (h *Handler) currentUser(w http.ResponseWriter, r *http.Request) (*store.User, bool) {
	claims, err := h.authenticate(r)
	if err != nil {
		settingsFail(w, http.StatusUnauthorized, "Unauthorized")
		return nil, false
	}
	user, err := h.users.FindByID(r.Context(), claims.UserID)
	if errors.Is(err, store.ErrNotFound) {
		settingsFail(w, http.StatusUnauthorized, "Unauthorized")
		return nil, false
	}
	if err != nil {
		log.Printf("settings: gagal membaca database: %v", err)
		settingsFail(w, http.StatusServiceUnavailable, "Layanan database tidak tersedia")
		return nil, false
	}
	return user, true
}

func validAbsoluteHTTPURL(raw string) bool {
	u, err := url.Parse(raw)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

func validateProfile(req updateProfileRequest) []string {
	var errs []string
	if utf8.RuneCountInString(req.FullName) > maxFullNameLen {
		errs = append(errs, "Full name must not exceed 100 characters.")
	}
	if utf8.RuneCountInString(req.UserName) > maxUserNameLen {
		errs = append(errs, "Username must not exceed 256 characters.")
	}
	if strings.TrimSpace(req.PhoneNumber) != "" && !phoneRe.MatchString(strings.TrimSpace(req.PhoneNumber)) {
		errs = append(errs, "Phone number format is invalid.")
	}
	if utf8.RuneCountInString(req.Bio) > maxBioLen {
		errs = append(errs, "Bio must not exceed 500 characters.")
	}
	if strings.TrimSpace(req.AvatarURL) != "" {
		if len(req.AvatarURL) > maxAvatarURLLen {
			errs = append(errs, "Avatar URL is too long.")
		}
		if !validAbsoluteHTTPURL(req.AvatarURL) {
			errs = append(errs, "Avatar URL must be a valid http or https address.")
		}
	}
	return errs
}

// UpdateProfile: PUT /settings/profile.
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		settingsFail(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	// Autentikasi lebih dulu (padanan [Authorize] sumber): pemanggil anonim tidak melihat detail validasi.
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	var req updateProfileRequest
	if !decodeSettingsBody(w, r, &req) {
		return
	}
	if errs := validateProfile(req); len(errs) > 0 {
		settingsValidation(w, errs)
		return
	}

	upd := store.ProfileUpdate{PhoneNumber: strings.TrimSpace(req.PhoneNumber), Bio: req.Bio}
	if name := strings.TrimSpace(req.FullName); name != "" {
		upd.Name = &name
	}
	if req.AvatarURL != "" && strings.TrimSpace(req.AvatarURL) != "" {
		avatar := strings.TrimSpace(req.AvatarURL)
		upd.AvatarURL = &avatar
	}
	if userName := strings.TrimSpace(req.UserName); userName != "" && req.UserName != user.UserName {
		if !userNameRe.MatchString(userName) {
			settingsFail(w, http.StatusBadRequest, "Username '"+userName+"' is invalid, can only contain letters or digits.")
			return
		}
		upd.UserName = &userName
	}

	_, err := h.users.UpdateProfile(r.Context(), user.ID, upd)
	switch {
	case errors.Is(err, store.ErrUserNameTaken):
		settingsFail(w, http.StatusBadRequest, "Username '"+*upd.UserName+"' is already taken.")
	case errors.Is(err, store.ErrNotFound):
		settingsFail(w, http.StatusUnauthorized, "Unauthorized")
	case err != nil:
		log.Printf("settings/profile: gagal menulis database: %v", err)
		settingsFail(w, http.StatusServiceUnavailable, "Layanan database tidak tersedia")
	default:
		settingsOK(w, "Profile updated successfully.")
	}
}

// ChangePassword: POST /settings/change-password.
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		settingsFail(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	var req changePasswordRequest
	if !decodeSettingsBody(w, r, &req) {
		return
	}

	var errs []string
	if req.CurrentPassword == "" {
		errs = append(errs, "Current password is required.")
	}
	if len(req.CurrentPassword) > maxPasswordLen {
		errs = append(errs, "Current password must not exceed 128 characters.")
	}
	switch {
	case req.NewPassword == "":
		errs = append(errs, "New password is required.")
	case len(req.NewPassword) < minNewPasswordLen:
		errs = append(errs, "New password must be at least 8 characters.")
	case len(req.NewPassword) > maxPasswordLen:
		errs = append(errs, "New password must not exceed 128 characters.")
	case req.NewPassword == req.CurrentPassword:
		errs = append(errs, "New password must be different from the current password.")
	}
	if len(errs) > 0 {
		settingsValidation(w, errs)
		return
	}

	// Akun tanpa kata sandi (login Google) tidak punya sandi lama yang bisa dicocokkan.
	valid := false
	if user.PasswordHash != "" {
		v, err := password.Verify(req.CurrentPassword, user.PasswordHash)
		valid = err == nil && v
	}
	if !valid {
		settingsFail(w, http.StatusBadRequest, "Incorrect password.")
		return
	}

	hash, err := password.Hash(req.NewPassword)
	if err != nil {
		settingsFail(w, http.StatusInternalServerError, "Gagal memproses kata sandi")
		return
	}
	switch err := h.users.UpdatePasswordHash(r.Context(), user.ID, hash); {
	case errors.Is(err, store.ErrNotFound):
		settingsFail(w, http.StatusUnauthorized, "Unauthorized")
	case err != nil:
		log.Printf("settings/change-password: gagal menulis database: %v", err)
		settingsFail(w, http.StatusServiceUnavailable, "Layanan database tidak tersedia")
	default:
		settingsOK(w, "Password successfully updated.")
	}
}

// DeleteAccount: DELETE /settings/delete-account. Menghapus baris auth.users dan mengakhiri sesi cookie.
// Seperti sumber, data akuntansi pengguna di tabel Nest tidak ikut dihapus.
func (h *Handler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		settingsFail(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	switch err := h.users.Delete(r.Context(), user.ID); {
	case errors.Is(err, store.ErrNotFound):
		settingsFail(w, http.StatusUnauthorized, "Unauthorized")
	case err != nil:
		log.Printf("settings/delete-account: gagal menulis database: %v", err)
		settingsFail(w, http.StatusServiceUnavailable, "Layanan database tidak tersedia")
	default:
		h.clearCookie(w, SessionCookie)
		settingsOK(w, "Account successfully deleted.")
	}
}
