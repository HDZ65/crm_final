/**
 * Default values used across CRM microservices
 * Centralizing these prevents magic numbers in code
 */

// Tax rates
export const DEFAULT_TVA_RATE = 20;
export const TVA_RATE_REDUCED = 10;
export const TVA_RATE_SUPER_REDUCED = 5.5;
export const TVA_RATE_ZERO = 0;

// Countries
export const DEFAULT_COUNTRY = 'France';
export const DEFAULT_COUNTRY_CODE = 'FR';

// Currencies
export const DEFAULT_CURRENCY = 'EUR';
export const CURRENCY_SYMBOL = '€';

// Date formats
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE_LARGE = 50;
export const MAX_PAGE_SIZE = 100;

// Invoice
export const DEFAULT_INVOICE_PREFIX = 'FAC';
export const DEFAULT_PAYMENT_TERMS_DAYS = 30;
export const INVOICE_NUMBER_PADDING = 6; // FAC-000001

// Client
export const DEFAULT_CLIENT_STATUS = 'ACTIF';
export const DEFAULT_CLIENT_TYPE = 'PARTICULIER';

// Contract
export const DEFAULT_CONTRACT_STATUS = 'BROUILLON';
export const DEFAULT_CONTRACT_DURATION_MONTHS = 12;

// Commission
export const DEFAULT_COMMISSION_RATE = 10;
export const MIN_COMMISSION_RATE = 0;
export const MAX_COMMISSION_RATE = 100;

// Retry
export const DEFAULT_MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAY_MS = 1000;
export const DEFAULT_RETRY_BACKOFF_MULTIPLIER = 2;

// Timeout
export const DEFAULT_GRPC_TIMEOUT_MS = 5000;
export const DEFAULT_HTTP_TIMEOUT_MS = 30000;

// File upload
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed file types
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
] as const;

// Email
export const DEFAULT_EMAIL_BATCH_SIZE = 50;
export const MAX_EMAIL_ATTACHMENTS = 5;
