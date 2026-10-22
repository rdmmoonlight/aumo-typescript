import { baseApi } from "@/lib/apiClient";

// --- Types Request & Response ---
export interface LoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean;
  isMobileClient?: boolean;
  userAgent?: string;
  operatingSystem?: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  isMobileClient?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userId?: string;
  fullName?: string;
  avatarUrl?: string;
  token?: string;
  lockoutEnd?: string;
  errors?: string[];
}

export interface UserProfileData {
  id: string;
  userId: string;
  email: string;
  userName: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  roles: string[];
  customClaims: Record<string, any>[];
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfileData;
  message?: string;
}

export interface CommonActionResponse {
  success: boolean;
  message: string;
}

// --- Inject Endpoints ke baseApi ---
export const authApi = baseApi.injectEndpoints({
  // Mencegah error 'overrideExisting' saat Next.js Turbopack HMR / Fast Refresh
  overrideExisting: !process.env.PROD,
  endpoints: (builder) => ({
    // 1. POST /auth/login
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    // 2. POST /auth/google-login
    googleLogin: builder.mutation<AuthResponse, GoogleLoginRequest>({
      query: (body) => ({
        url: "/auth/google-login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    // 3. GET /auth/me
    getProfile: builder.query<ProfileResponse, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),

    // 4. POST /auth/logout (Digabung & disederhanakan)
    logout: builder.mutation<CommonActionResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

// Export hooks otomatis dari RTK Query
export const {
  useLoginMutation,
  useGoogleLoginMutation,
  useGetProfileQuery,
  useLogoutMutation,
} = authApi;
