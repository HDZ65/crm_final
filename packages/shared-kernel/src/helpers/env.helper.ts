import { z, ZodSchema } from 'zod';

export class EnvValidationError extends Error {
  constructor(public readonly errors: string[]) {
    const message = [
      'Environment validation failed:',
      ...errors.map(e => `  - ${e}`),
    ].join('\n');
    super(message);
    this.name = 'EnvValidationError';
  }
}

export function validateEnv<T extends ZodSchema>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
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

export const envSchema = {
  requiredString: () => z.string().min(1, 'Required'),
  requiredUrl: () => z.string().min(1, 'Required').url('Must be a valid URL'),
  requiredInt: () => z.coerce.number().int('Must be an integer'),
  optionalString: (defaultValue: string) => z.string().default(defaultValue),
  optionalInt: (defaultValue: number) => z.coerce.number().int().default(defaultValue),
  optionalBoolean: (defaultValue: boolean) => z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .default(defaultValue ? 'true' : 'false'),
};

export { z } from 'zod';
