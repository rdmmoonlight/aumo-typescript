import { baseApi } from "@/lib/apiClient";

// --- DTO Types ---
export interface UpdateProfileRequest {
  fullName?: string | null;
  userName?: string | null;
  phoneNumber?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}

export interface RevokeSessionArg {
  sessionId: string;
}

// --- Slice Definition ---
export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // PUT /settings/profile
    updateProfile: builder.mutation<unknown, UpdateProfileRequest>({
      query: (body) => ({
        url: "/settings/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),

    // POST /settings/avatar
    uploadAvatar: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "/settings/avatar",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Settings"],
    }),

    // POST /settings/change-password
    changePassword: builder.mutation<unknown, ChangePasswordRequest>({
      query: (body) => ({
        url: "/settings/change-password",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),

    // DELETE /settings/delete-account
    deleteAccount: builder.mutation<unknown, void>({
      query: () => ({
        url: "/settings/delete-account",
        method: "DELETE",
      }),
      invalidatesTags: ["Settings"],
    }),

    // GET /settings/guardian/dashboard
    getGuardianDashboard: builder.query<unknown, void>({
      query: () => "/settings/guardian/dashboard",
      providesTags: ["Settings"],
    }),

    // POST /settings/guardian/revoke-session/{sessionId}
    revokeSessionById: builder.mutation<unknown, RevokeSessionArg>({
      query: ({ sessionId }) => ({
        url: `/settings/guardian/revoke-session/${sessionId}`,
        method: "POST",
      }),
      invalidatesTags: ["Settings"],
    }),

    // POST /settings/guardian/revoke-all-sessions
    revokeAllSessions: builder.mutation<unknown, void>({
      query: () => ({
        url: "/settings/guardian/revoke-all-sessions",
        method: "POST",
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
  overrideExisting: false,
});
