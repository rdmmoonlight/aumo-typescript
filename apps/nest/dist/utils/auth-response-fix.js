export const formatAuthResponse = {
    checkEmail: (email, available) => ({
        success: true,
        email,
        available,
    }),
    registerSuccess: (userId, token) => ({
        success: true,
        userId,
        ...(token ? { token } : {}),
    }),
    loginSuccess: (message, token) => ({
        success: true,
        message,
        ...(token ? { token } : {}),
    }),
};
//# sourceMappingURL=auth-response-fix.js.map