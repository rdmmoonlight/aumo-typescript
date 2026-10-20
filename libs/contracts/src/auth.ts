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