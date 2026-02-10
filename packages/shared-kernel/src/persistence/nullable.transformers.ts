import type { ValueTransformer } from 'typeorm';

export const nullableStringTransformer: ValueTransformer = {
  to: (value: string | undefined): string | null => (value === undefined ? null : value),
  from: (value: string | null): string | undefined => (value === null ? undefined : value),
};

export const nullableNumberTransformer: ValueTransformer = {
  to: (value: number | undefined): number | null => (value === undefined ? null : value),
  from: (value: number | null): number | undefined => (value === null ? undefined : value),
};

export const nullableBigintTransformer: ValueTransformer = {
  to: (value: number | undefined): string | null => (value === undefined ? null : String(value)),
  from: (value: string | null): number | undefined => (value === null ? undefined : Number(value)),
};

export const nullableJsonTransformer: ValueTransformer = {
  to: (value: Record<string, unknown> | undefined): string | null =>
    value === undefined ? null : JSON.stringify(value),
  from: (value: string | null): Record<string, unknown> | undefined => {
    if (value === null) return undefined;
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  },
};
