import { z } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  // Mendukung 2 cara pakai:
  // new AppError('message', 401)  atau  new AppError(401, 'message')
  constructor(message: string, statusCode?: number, isOperational?: boolean);
  constructor(statusCode: number, message: string, isOperational?: boolean);
  constructor(arg1: string | number, arg2: string | number = 400, isOperational = true) {
    let message: string;
    let statusCode: number;

    if (typeof arg1 === 'number') {
      statusCode = arg1;
      message = String(arg2);
    } else {
      message = arg1;
      statusCode = typeof arg2 === 'number' ? arg2 : 400;
    }

    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(zodError: z.ZodError) {
    super('Validasi gagal', 400);
    this.name = 'ValidationError';
    this.errors = z.flattenError(zodError).fieldErrors as Record<string, string[]>;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export default AppError;
