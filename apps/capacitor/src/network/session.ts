/**
 * Status sesi di memori (padanan SessionManager.kt). Token JWT dari response
 * login disisipkan sebagai "Authorization: Bearer" oleh apiClient.
 */
export class Session {
  token: string | null = null;
  userId: string | null = null;
  fullName: string | null = null;

  isLoggedIn(): boolean {
    return this.token !== null && this.token.trim() !== '';
  }

  set(data: { token: string; userId: string | null; fullName: string | null }): void {
    this.token = data.token;
    this.userId = data.userId;
    this.fullName = data.fullName;
  }

  clear(): void {
    this.token = null;
    this.userId = null;
    this.fullName = null;
  }
}
