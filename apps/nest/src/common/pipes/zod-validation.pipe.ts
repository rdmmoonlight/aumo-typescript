import { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ValidationError } from '../../lib/errors.js';

/**
 * Validasi input (body/query/param) dengan skema Zod.
 * Gagal -> ValidationError -> 400 { success: false, message: 'Validasi gagal', errors }.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value ?? {});
    if (!result.success) {
      throw new ValidationError(result.error);
    }
    return result.data;
  }
}
