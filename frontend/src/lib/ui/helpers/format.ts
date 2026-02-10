/**
 * Formatting helpers for proto string values (serialized decimals)
 * Proto uses string for decimal fields to preserve precision.
 * These helpers format them for UI display.
 */

const FR_NUMBER_FORMAT = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FR_CURRENCY_FORMAT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FR_PERCENT_FORMAT = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a proto decimal string as currency
 * @example formatMontant("1234.56") → "1 234,56 €"
 * @example formatMontant("0") → "0,00 €"
 */
export function formatMontant(value: string, devise = "EUR"): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,00 €";
  if (devise !== "EUR") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: devise,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
  return FR_CURRENCY_FORMAT.format(num);
}

/**
 * Format a proto decimal string as a number (no currency symbol)
 * @example formatNumber("1234.56") → "1 234,56"
 */
export function formatNumber(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,00";
  return FR_NUMBER_FORMAT.format(num);
}

/**
 * Format a proto decimal string as a percentage
 * The value is expected to be a ratio (e.g., "0.15" for 15%)
 * @example formatTaux("0.15") → "15,00 %"
 * @example formatTaux("15") → "15,00 %" (if already in percent form)
 */
export function formatTaux(value: string, alreadyPercent = false): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0,00 %";
  if (alreadyPercent) {
    return `${FR_NUMBER_FORMAT.format(num)} %`;
  }
  return FR_PERCENT_FORMAT.format(num);
}

/**
 * Parse a proto decimal string to number for calculations
 * Use sparingly - prefer keeping values as strings and using format helpers for display
 * @example parseMontant("1234.56") → 1234.56
 */
export function parseMontant(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}
