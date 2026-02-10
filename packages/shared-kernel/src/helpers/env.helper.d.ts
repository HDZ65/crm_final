import { z, ZodSchema } from 'zod';
export declare class EnvValidationError extends Error {
    readonly errors: string[];
    constructor(errors: string[]);
}
export declare function validateEnv<T extends ZodSchema>(schema: T, env?: NodeJS.ProcessEnv): z.infer<T>;
export declare const envSchema: {
    requiredString: () => z.ZodString;
    requiredUrl: () => z.ZodString;
    requiredInt: () => z.ZodNumber;
    optionalString: (defaultValue: string) => z.ZodDefault<z.ZodString>;
    optionalInt: (defaultValue: number) => z.ZodDefault<z.ZodNumber>;
    optionalBoolean: (defaultValue: boolean) => z.ZodDefault<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
};
export { z } from 'zod';
//# sourceMappingURL=env.helper.d.ts.map