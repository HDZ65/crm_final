/**
 * Standardized status enums across all microservices
 * Use these instead of string literals
 */

/**
 * Client status
 */
export enum ClientStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  PROSPECT = 'PROSPECT',
}

/**
 * Client type
 */
export enum ClientType {
  PARTICULIER = 'PARTICULIER',
  ENTREPRISE = 'ENTREPRISE',
  PARTENAIRE = 'PARTENAIRE',
}

/**
 * Invoice status
 */
export enum FactureStatus {
  BROUILLON = 'BROUILLON',
  EMISE = 'EMISE',
  ENVOYEE = 'ENVOYEE',
  PAYEE = 'PAYEE',
  PARTIELLE = 'PARTIELLE',
  ANNULEE = 'ANNULEE',
  AVOIR = 'AVOIR',
}

/**
 * Contract status
 */
export enum ContratStatus {
  BROUILLON = 'BROUILLON',
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  RESILIE = 'RESILIE',
  EXPIRE = 'EXPIRE',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

/**
 * Payment method
 */
export enum PaymentMethod {
  CARD = 'CARD',
  SEPA = 'SEPA',
  TRANSFER = 'TRANSFER',
  PAYPAL = 'PAYPAL',
  CHECK = 'CHECK',
  CASH = 'CASH',
}

/**
 * Document type
 */
export enum DocumentType {
  FACTURE = 'FACTURE',
  DEVIS = 'DEVIS',
  CONTRAT = 'CONTRAT',
  MANDAT = 'MANDAT',
  AUTRE = 'AUTRE',
}

/**
 * User role
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COMMERCIAL = 'COMMERCIAL',
  USER = 'USER',
}

/**
 * Organisation status
 */
export enum OrganisationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  INACTIVE = 'INACTIVE',
}

/**
 * Notification type
 */
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Activity type
 */
export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  TASK = 'TASK',
  NOTE = 'NOTE',
}
