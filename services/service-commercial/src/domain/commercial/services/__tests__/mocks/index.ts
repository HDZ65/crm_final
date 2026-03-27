/**
 * Barrel file for test mocks
 * Exports all mock factories and utilities for easy importing in test files
 */

export {
  createMockBareme,
  createMockCommission,
  createMockContrat,
  createMockPalier,
  roundToTwoDec,
  calculatePercentage,
} from '../helpers/calculation-helpers';

export {
  expectDecimalEqual,
  isDecimalEqual,
  roundDecimal,
  formatDecimal,
  parseDecimal,
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  divideDecimals,
  calculatePercentageDecimal,
  isValidDecimal,
  toDecimal,
} from '../helpers/decimal-helpers';
