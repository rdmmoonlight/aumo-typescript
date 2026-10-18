import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { CreateUserSchema } from '@app/contracts';
import { logger } from '../../../libs/logger/src/index.js';

// Simulasi handler/app HTTP sederhana
const mockApp = async (req: any, res: any) => {
  if (req.method === 'POST' && req.url === '/users') {
    const parseResult = CreateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      logger.warn({ errors: parseResult.error.format() }, 'Validation failed');
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid input' }));
    }

    logger.info({ email: parseResult.data.email }, 'User created successfully');
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...parseResult.data,
        createdAt: new Date().toISOString()
      })
    );
  }
};

describe('POST /users (Integration)', () => {
  it('harus mengembalikan 201 jika payload valid', async () => {
    const payload = {
      name: 'Ghofur',
      email: 'ghofur@example.com'
    };

    const response = await request(mockApp)
      .post('/users')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(payload.name);
  });

  it('harus mengembalikan 400 jika payload tidak sesuai schema', async () => {
    const invalidPayload = {
      name: 'A' // Nama terlalu pendek (min 2 karakter)
    };

    const response = await request(mockApp)
      .post('/users')
      .send(invalidPayload);

    expect(response.status).toBe(400);
  });
});
