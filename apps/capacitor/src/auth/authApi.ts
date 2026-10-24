import type { ApiClient, ApiResponse } from '../network/apiClient';

// isMobileClient WAJIB true: backend memakai flag ini untuk memilih jalur JWT
// (response berisi "token", tanpa cookie). Jika false, field "token" tidak dikirim.
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
  isMobileClient: true;
  operatingSystem: 'Android';
}

// userId/fullName/token HANYA ada saat success == true.
export interface LoginResponse {
  success: boolean;
  message: string;
  userId?: string;
  fullName?: string;
  token?: string;
}

/** Validasi bentuk response login. null bila bukan objek yang dikenali (mis. HTML error proxy). */
export function parseLoginResponse(data: unknown): LoginResponse | null {
  if (typeof data !== 'object' || data === null) return null;
  const raw = data as Record<string, unknown>;
  if (typeof raw.success !== 'boolean') return null;
  const str = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;
  return {
    success: raw.success,
    message: str(raw.message) ?? '',
    userId: str(raw.userId),
    fullName: str(raw.fullName),
    token: str(raw.token),
  };
}

export class AuthApi {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  login(params: { email: string; password: string; rememberMe: boolean }): Promise<ApiResponse> {
    const body: LoginRequest = {
      ...params,
      isMobileClient: true,
      operatingSystem: 'Android',
    };
    return this.client.post('/auth/login', body);
  }

  me(): Promise<ApiResponse> {
    return this.client.get('/auth/me');
  }

  logout(): Promise<ApiResponse> {
    return this.client.post('/auth/logout');
  }
}
