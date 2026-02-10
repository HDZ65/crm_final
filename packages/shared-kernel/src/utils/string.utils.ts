/**
 * String Utilities
 * camelCase <-> snake_case conversions for proto/database mapping
 */

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function mapRowToCamel<T extends Record<string, unknown>>(
  row: Record<string, unknown>,
): T {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [snakeToCamel(key), value]),
  ) as T;
}
