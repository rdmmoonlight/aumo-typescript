import { UserSchema } from '../libs/contracts/src/user.js';
import { readFileSync } from 'fs';

const samplePayload = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ghofur',
  email: 'ghofur@example.com',
  createdAt: '2026-10-19T00:00:00Z'
};

const result = UserSchema.safeParse(samplePayload);
if (!result.success) {
  console.error('Contract mismatch in TypeScript Zod Schema!', result.error);
  process.exit(1);
}

console.log('Contract validation passed successfully across schemas.');
