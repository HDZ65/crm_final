/**
 * Standardized status enums across all microservices
 * Use these instead of string literals
 */

export enum ClientStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  PROSPECT = 'PROSPECT',
}

export enum ClientType {
  PARTICULIER = 'PARTICULIER',
  ENTREPRISE = 'ENTREPRISE',
  PARTENAIRE = 'PARTENAIRE',
}

export enum FactureStatus {
  BROUILLON = 'BROUILLON',
  EMISE = 'EMISE',
  ENVOYEE = 'ENVOYEE',
  PAYEE = 'PAYEE',
  PARTIELLE = 'PARTIELLE',
  ANNULEE = 'ANNULEE',
  AVOIR = 'AVOIR',
}

export enum ContratStatus {
  BROUILLON = 'BROUILLON',
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  RESILIE = 'RESILIE',
  EXPIRE = 'EXPIRE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  SEPA = 'SEPA',
  TRANSFER = 'TRANSFER',
  PAYPAL = 'PAYPAL',
  CHECK = 'CHECK',
  CASH = 'CASH',
}

export enum DocumentType {
  FACTURE = 'FACTURE',
  DEVIS = 'DEVIS',
  CONTRAT = 'CONTRAT',
  MANDAT = 'MANDAT',
  AUTRE = 'AUTRE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COMMERCIAL = 'COMMERCIAL',
  USER = 'USER',
}

export enum OrganisationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  INACTIVE = 'INACTIVE',
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  TASK = 'TASK',
  NOTE = 'NOTE',
}
