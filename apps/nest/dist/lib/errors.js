import { z } from 'zod';
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(arg1, arg2 = 400, isOperational = true) {
        let message;
        let statusCode;
        if (typeof arg1 === 'number') {
            statusCode = arg1;
            message = String(arg2);
        }
        else {
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
    errors;
    constructor(zodError) {
        super('Validasi gagal', 400);
        this.name = 'ValidationError';
        this.errors = z.flattenError(zodError).fieldErrors;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
export default AppError;
//# sourceMappingURL=errors.js.map