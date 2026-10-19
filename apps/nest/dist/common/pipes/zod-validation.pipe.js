import { ValidationError } from '../../lib/errors.js';
export class ZodValidationPipe {
    schema;
    constructor(schema) {
        this.schema = schema;
    }
    transform(value) {
        const result = this.schema.safeParse(value ?? {});
        if (!result.success) {
            throw new ValidationError(result.error);
        }
        return result.data;
    }
}
//# sourceMappingURL=zod-validation.pipe.js.map