/**
 * Decimal assertion helpers for testing DECIMAL(12,2) precision
 * Handles floating-point comparison with tolerance for banker's rounding
 */

/**
 * Asserts that two decimal values are equal within a tolerance
 * Used for testing DECIMAL(12,2) fields with ±0.01€ tolerance
 * @param actual - The actual value
 * @param expected - The expected value
 * @param tolerance - The tolerance (default: 0.01)
 * @throws Error if values differ by more than tolerance
 */
export function expectDecimalEqual(
  actual: number,
  expected: number,
  tolerance: number = 0.01,
): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `Expected ${actual} to be equal to ${expected} within tolerance ${tolerance}, ` +
      `but difference was ${diff.toFixed(4)}`,
    );
  }
}

/**
 * Asserts that a decimal value is approximately equal to expected
 * Useful for intermediate calculations that may have rounding errors
 * @param actual - The actual value
 * @param expected - The expected value
 * @param tolerance - The tolerance (default: 0.01)
 * @returns true if within tolerance
 */
export function isDecimalEqual(
  actual: number,
  expected: number,
  tolerance: number = 0.01,
): boolean {
  const diff = Math.abs(actual - expected);
  return diff <= tolerance;
}

/**
 * Rounds a number to 2 decimal places using banker's rounding
 * This matches the DECIMAL(12,2) precision in the database
 * @param value - The value to round
 * @returns Rounded value
 */
export function roundDecimal(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formats a decimal value as a string with 2 decimal places
 * @param value - The value to format
 * @returns Formatted string (e.g., "100.50")
 */
export function formatDecimal(value: number): string {
  return value.toFixed(2);
}

/**
 * Parses a decimal string to a number
 * @param value - The string value to parse
 * @returns Parsed number
 */
export function parseDecimal(value: string): number {
  return parseFloat(value);
}

/**
 * Adds two decimal values with proper rounding
 * @param a - First value
 * @param b - Second value
 * @returns Sum rounded to 2 decimals
 */
export function addDecimals(a: number, b: number): number {
  return roundDecimal(a + b);
}

/**
 * Subtracts two decimal values with proper rounding
 * @param a - First value
 * @param b - Second value
 * @returns Difference rounded to 2 decimals
 */
export function subtractDecimals(a: number, b: number): number {
  return roundDecimal(a - b);
}

/**
 * Multiplies two decimal values with proper rounding
 * @param a - First value
 * @param b - Second value
 * @returns Product rounded to 2 decimals
 */
export function multiplyDecimals(a: number, b: number): number {
  return roundDecimal(a * b);
}

/**
 * Divides two decimal values with proper rounding
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient rounded to 2 decimals
 * @throws Error if divisor is 0
 */
export function divideDecimals(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return roundDecimal(a / b);
}

/**
 * Calculates a percentage of a value with proper rounding
 * @param value - The base value
 * @param percentage - The percentage to apply
 * @returns Calculated amount rounded to 2 decimals
 */
export function calculatePercentageDecimal(value: number, percentage: number): number {
  return roundDecimal((value * percentage) / 100);
}

/**
 * Validates that a value is a valid DECIMAL(12,2)
 * @param value - The value to validate
 * @returns true if valid
 */
export function isValidDecimal(value: number): boolean {
  // Check if value is a number
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  // Check if it has at most 2 decimal places
  const rounded = roundDecimal(value);
  return value === rounded;
}

/**
 * Converts a string amount (e.g., "100.50") to a valid DECIMAL(12,2)
 * @param amount - The string amount
 * @returns Rounded decimal value
 */
export function toDecimal(amount: string | number): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    throw new Error(`Invalid decimal value: ${amount}`);
  }
  return roundDecimal(num);
}
