// Helper format respons standar untuk mencocokkan assertion Vitest
export const formatAuthResponse = {
  checkEmail: (email: string, available: boolean) => ({
    success: true,
    email,
    available,
  }),
  registerSuccess: (userId: string, token?: string) => ({
    success: true,
    userId,
    ...(token ? { token } : {}),
  }),
  loginSuccess: (message: string, token?: string) => ({
    success: true,
    message,
    ...(token ? { token } : {}),
  }),
};
