// libs/contracts/src/auth.ts

// K1: Payload Request
export type LoginRequest = {
    email: string;
    password: string;
    client: 'web' | 'mobile'; // K1: Mengirim 'client', bukan 'clientType'
};

export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
    client: 'web' | 'mobile';
};

// K5: Model pengguna sesuai respons backend Go
export type AuthUser = {
    id: string; // K3: Dipetakan dari user_id/id
    email: string;
    name: string;
};

// K3: Struktur klaim JWT yang dikembalikan oleh endpoint /auth/me
export type JwtClaims = {
    user_id: string;
    email: string;
    [key: string]: unknown;
};

// K2: Respons Login/Register dari Go membalas { message, data: <user> }
export type AuthResponse = {
    message: string;
    data: AuthUser;
};

// K3: Endpoint /auth/me mengembalikan data klaim JWT
export type MeResponse = {
    message?: string;
    data: JwtClaims;
};

/**
 * Helper function untuk memetakan klaim JWT dari /auth/me ke model AuthUser
 * K3 & K5: Mengakomodasi fallback nama dari respons login lokal/storage
 */
export function mapClaimsToAuthUser(claims: JwtClaims, fallbackName: string = ''): AuthUser {
    return {
        id: claims.user_id,
        email: claims.email,
        name: fallbackName,
    };
}