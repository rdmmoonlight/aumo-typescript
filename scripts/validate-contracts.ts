// scripts/validate-contracts.ts
import {
  AuthResponseSchema,
  AuthUserSchema,
  LoginRequestSchema,
  MeResponseSchema,
  RegisterRequestSchema
} from '../libs/contracts/src/auth.schema.js';
import {
  CreatePeriodRequestSchema,
  GetPeriodsResponseSchema
} from '../libs/contracts/src/periods.schema.js';
import { UserSchema } from '../libs/contracts/src/user.schema.js';

// --- Sample Data ---

const sampleUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ghofur',
  email: 'ghofur@example.com',
  createdAt: '2026-10-19T00:00:00Z'
};

// K6 & K8 - Sample GetPeriodsResponse (tanpa userId)
const sampleGetPeriodsResponse = {
  success: true,
  selectedPeriodId: '123e4567-e89b-12d3-a456-426614174000',
  periods: [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Januari 2026',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      isClosed: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
      // Note: K8 - userId intentionally omitted
    }
  ]
};

// K7 - Sample CreatePeriodRequest
const sampleCreatePeriodRequest = {
  year: 2026,
  month: 1,
  setupMode: 'CreateNew'
};

// K1 - Sample Login Request dengan client "web"
const sampleLoginRequest = {
  email: 'ghofur@example.com',
  password: 'securepassword123',
  client: 'web'
};

// K1 & K4 - Sample Register Request
const sampleRegisterRequest = {
  name: 'Ghofur',
  email: 'ghofur@example.com',
  password: 'securepassword123',
  client: 'web'
};

// K5 - Sample AuthUser (hanya id, email, name)
const sampleAuthUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'ghofur@example.com',
  name: 'Ghofur'
};

// K2 - Sample Auth Response dari Go { message, data: AuthUser }
const sampleAuthResponse = {
  message: 'Login successful',
  data: sampleAuthUser
};

// K3 - Sample Me Response dari Go { message, data: JWT Claims }
const sampleMeResponse = {
  message: 'Authenticated',
  data: {
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'ghofur@example.com'
  }
};

// --- Test Suite ---

const tests = [
  { name: 'UserSchema', schema: UserSchema, payload: sampleUser },
  { name: 'GetPeriodsResponseSchema', schema: GetPeriodsResponseSchema, payload: sampleGetPeriodsResponse },
  { name: 'CreatePeriodRequestSchema', schema: CreatePeriodRequestSchema, payload: sampleCreatePeriodRequest },

  // Validation K1 - K5 Auth Contracts
  { name: 'LoginRequestSchema', schema: LoginRequestSchema, payload: sampleLoginRequest },
  { name: 'RegisterRequestSchema', schema: RegisterRequestSchema, payload: sampleRegisterRequest },
  { name: 'AuthUserSchema', schema: AuthUserSchema, payload: sampleAuthUser },
  { name: 'AuthResponseSchema', schema: AuthResponseSchema, payload: sampleAuthResponse },
  { name: 'MeResponseSchema', schema: MeResponseSchema, payload: sampleMeResponse }
];

for (const test of tests) {
  if (!test.schema) {
    console.error(`❌ Validation Error: Schema "${test.name}" is undefined. Check export in libs/contracts.`);
    process.exit(1);
  }

  const result = test.schema.safeParse(test.payload);
  if (!result.success) {
    console.error(`❌ Contract mismatch in ${test.name}!`, result.error.format());
    process.exit(1);
  }
}

console.log('✅ Contract validation passed successfully across all schemas.');