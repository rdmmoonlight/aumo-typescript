import type { OpenAPIObject } from '@nestjs/swagger';

/**
 * Rute layanan Go (services/auth) tidak dikenal Nest, sehingga tidak muncul
 * otomatis di Scalar. Definisi ini digabungkan ke dokumen OpenAPI Nest.
 * Nginx meneruskan /auth/* langsung ke Go.
 */
const json = (schema: Record<string, unknown>) => ({
  'application/json': { schema },
});

const authResponse = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    token: { type: 'string', description: 'Hanya untuk client mobile' },
    data: { type: 'object', additionalProperties: true },
  },
  required: ['message'],
};

const errorResponse = (description: string) => ({
  description,
  content: json({
    type: 'object',
    properties: { message: { type: 'string' } },
  }),
});

const credentials = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8, maxLength: 128 },
  },
  required: ['email', 'password'],
};

export const authPaths: OpenAPIObject['paths'] = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Daftar akun baru',
      requestBody: {
        required: true,
        content: json({
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            ...credentials.properties,
          },
          required: ['name', 'email', 'password'],
        }),
      },
      responses: {
        '201': { description: 'Akun dibuat', content: json(authResponse) },
        '400': errorResponse('Data tidak valid'),
        '409': errorResponse('Email sudah terdaftar'),
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login email dan kata sandi',
      description:
        '`client: "web"` (default) mengisi cookie `auth_session`. `client: "mobile"` mengembalikan `token` di body.',
      requestBody: {
        required: true,
        content: json({
          type: 'object',
          properties: {
            ...credentials.properties,
            client: { type: 'string', enum: ['web', 'mobile'], default: 'web' },
          },
          required: ['email', 'password'],
        }),
      },
      responses: {
        '200': { description: 'Login berhasil', content: json(authResponse) },
        '401': errorResponse('Email atau kata sandi salah'),
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout (hapus cookie sesi)',
      responses: { '200': { description: 'Berhasil', content: json(authResponse) } },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Profil pengguna dari token',
      security: [{ bearer: [] }, { cookie: [] }],
      responses: {
        '200': { description: 'Klaim token', content: json(authResponse) },
        '401': errorResponse('Token tidak ada atau tidak sah'),
      },
    },
  },
  '/auth/validate': {
    get: {
      tags: ['Auth'],
      summary: 'Validasi token',
      description: 'Mengembalikan klaim dan header `X-User-Id`. Dipakai gerbang nginx.',
      security: [{ bearer: [] }, { cookie: [] }],
      responses: {
        '200': { description: 'Token sah' },
        '401': errorResponse('Token tidak ada atau tidak sah'),
      },
    },
  },
  '/auth/google-login': {
    get: {
      tags: ['Auth'],
      summary: 'Mulai login Google (redirect)',
      parameters: [
        {
          name: 'client',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['web', 'mobile'], default: 'web' },
        },
      ],
      responses: {
        '307': { description: 'Redirect ke halaman persetujuan Google' },
        '503': errorResponse('Login Google belum dikonfigurasi'),
      },
    },
  },
  '/auth/google-callback': {
    get: {
      tags: ['Auth'],
      summary: 'Callback Google OAuth',
      parameters: [
        { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'state', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Login berhasil (mobile: token di body)', content: json(authResponse) },
        '302': { description: 'Web: redirect ke FRONTEND_URL dengan cookie sesi' },
        '400': errorResponse('State atau kode tidak valid'),
      },
    },
  },
};

export function withAuthRoutes(document: OpenAPIObject): OpenAPIObject {
  return {
    ...document,
    paths: { ...authPaths, ...document.paths },
    tags: [...(document.tags ?? []), { name: 'Auth', description: 'Layanan Go (services/auth)' }],
    components: {
      ...document.components,
      securitySchemes: {
        ...document.components?.securitySchemes,
        bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        cookie: { type: 'apiKey', in: 'cookie', name: 'auth_session' },
      },
    },
  };
}
