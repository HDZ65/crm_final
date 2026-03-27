/**
 * Phone Normalizer Utility
 * Normalizes French phone numbers for client matching in CFAST integration
 *
 * Handles formats:
 * - +33 6 12 34 56 78 → 0612345678
 * - 0033612345678 → 0612345678
 * - 06.12.34.56.78 → 0612345678
 * - 06-12-34-56-78 → 0612345678
 * - 0612345678 → 0612345678
 */

/**
 * Normalizes a French phone number to standard format (0XXXXXXXXX)
 *
 * @param phone - Raw phone number string (may contain spaces, dots, dashes, parentheses)
 * @returns Normalized phone number (10 digits starting with 0), or empty string if invalid
 *
 * @example
 * normalizePhone('+33 6 12 34 56 78') // '0612345678'
 * normalizePhone('0033612345678') // '0612345678'
 * normalizePhone('06.12.34.56.78') // '0612345678'
 * normalizePhone('06-12-34-56-78') // '0612345678'
 * normalizePhone('0612345678') // '0612345678'
 * normalizePhone('') // ''
 * normalizePhone(null) // ''
 */
export function normalizePhone(phone: string | null | undefined): string {
  // Handle null/undefined
  if (!phone) {
    return '';
  }

  // Strip all spaces, dots, dashes, parentheses
  let normalized = phone.replace(/[\s.\-()]/g, '');

  // Replace +33 with 0
  if (normalized.startsWith('+33')) {
    normalized = '0' + normalized.slice(3);
  }

  // Replace 0033 with 0
  if (normalized.startsWith('0033')) {
    normalized = '0' + normalized.slice(4);
  }

  return normalized;
}

/**
 * Compares two phone numbers for equality after normalization
 *
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns true if both phones normalize to the same value, false otherwise
 *
 * @example
 * matchPhones('+33612345678', '0612345678') // true
 * matchPhones('0612345678', '0712345678') // false
 * matchPhones('06.12.34.56.78', '06-12-34-56-78') // true
 */
export function matchPhones(
  phone1: string | null | undefined,
  phone2: string | null | undefined,
): boolean {
  return normalizePhone(phone1) === normalizePhone(phone2);
}
