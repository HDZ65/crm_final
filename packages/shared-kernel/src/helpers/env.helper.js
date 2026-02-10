"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.envSchema = exports.EnvValidationError = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
class EnvValidationError extends Error {
    errors;
    constructor(errors) {
        const message = [
            'Environment validation failed:',
            ...errors.map(e => `  - ${e}`),
        ].join('\n');
        super(message);
        this.errors = errors;
        this.name = 'EnvValidationError';
    }
}
exports.EnvValidationError = EnvValidationError;
function validateEnv(schema, env = process.env) {
    const result = schema.safeParse(env);
    if (!result.success) {
        const errors = result.error.errors.map(err => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
        });
        throw new EnvValidationError(errors);
    }
    return result.data;
}
exports.envSchema = {
    requiredString: () => zod_1.z.string().min(1, 'Required'),
    requiredUrl: () => zod_1.z.string().min(1, 'Required').url('Must be a valid URL'),
    requiredInt: () => zod_1.z.coerce.number().int('Must be an integer'),
    optionalString: (defaultValue) => zod_1.z.string().default(defaultValue),
    optionalInt: (defaultValue) => zod_1.z.coerce.number().int().default(defaultValue),
    optionalBoolean: (defaultValue) => zod_1.z
        .enum(['true', 'false'])
        .transform(v => v === 'true')
        .default(defaultValue ? 'true' : 'false'),
};
var zod_2 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_2.z; } });
//# sourceMappingURL=env.helper.js.map