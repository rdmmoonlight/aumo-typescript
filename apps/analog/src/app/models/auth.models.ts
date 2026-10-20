export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: true;
  message: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name?: string;
  email: string;
  password: string;
}

export interface MeResponse {
  success: boolean;
  data: {
    user: AuthUser | null;
    session: { id: string; expiresAt: string } | null;
  };
}
