/**
 * Types for Maileva API - Envoi et suivi de courriers
 * Documentation: https://www.maileva.com/catalogue-api/envoi-et-suivi-de-courriers/
 */

/**
 * Authentication request
 */
export interface MailevaAuthRequest {
  login: string;
  password: string;
  client_id: string;
  client_secret: string;
}

/**
 * Authentication response
 */
export interface MailevaAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * Sending (envoi) creation request
 */
export interface MailevaSendingRequest {
  name: string;
  notification_email?: string;
  custom_id?: string;
  custom_data?: string;
  color_printing?: boolean;
  duplex_printing?: boolean;
  optional_address_sheet?: boolean;
  postage_type?: 'URGENT' | 'FAST' | 'ECONOMIC';
  print_sender_address?: boolean;
  sender_address_line_1?: string;
  sender_address_line_2?: string;
  sender_address_line_3?: string;
  sender_address_line_4?: string;
  sender_address_line_5?: string;
  sender_address_line_6?: string;
  sender_country_code?: string;
  archiving_duration?: 0 | 1 | 3 | 6 | 10;
  envelope_windows_type?: 'SIMPLE' | 'DOUBLE';
  treat_undelivered_mail?: boolean;
  notification_treat_undelivered_mail?: string[];
}

/**
 * Recipient (destinataire) structure
 * address_line_6 and country_code are required
 */
export interface MailevaRecipient {
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_4?: string;
  address_line_5?: string;
  address_line_6: string; // Required: Code postal + ville (ex: "75000 Paris")
  country_code: string; // Required: Code ISO-3166 (ex: "FR")
  custom_id?: string;
  custom_data?: string;
}

/**
 * Document structure
 */
export interface MailevaDocument {
  name: string;
  content: string; // Base64 encoded content
  content_type: string; // application/pdf
}

/**
 * Sending response
 */
export interface MailevaSendingResponse {
  id: string;
  name: string;
  status: MailevaSendingStatus;
  creation_date: string;
  submission_date?: string;
  custom_id?: string;
  total_price?: number;
  recipient_count?: number;
  notification_email?: string;
}

/**
 * Sending status (from OpenAPI spec)
 */
export type MailevaSendingStatus =
  | 'DRAFT' // Brouillon
  | 'PENDING' // En attente d'analyse
  | 'ACCEPTED' // Accepté, sera traité
  | 'REJECTED' // Refusé
  | 'PROCESSED' // Traité, tous les destinataires valides
  | 'PROCESSED_WITH_ERRORS'; // Traité avec certains destinataires invalides

/**
 * Tracking information response
 */
export interface MailevaTrackingResponse {
  sending_id: string;
  recipient_id: string;
  status: MailevaRecipientStatus;
  tracking_number?: string;
  events: MailevaTrackingEvent[];
  last_update: string;
}

/**
 * Recipient status (from OpenAPI spec)
 */
export type MailevaRecipientStatus =
  | 'DRAFT' // Ajouté à un envoi au statut draft
  | 'PENDING' // Ni traité, ni rejeté
  | 'PROCESSED' // Mis sous pli
  | 'REJECTED'; // Non valide

/**
 * Tracking event
 */
export interface MailevaTrackingEvent {
  code: string;
  label: string;
  date: string;
  location?: string;
}

/**
 * Maileva API error response
 */
export interface MailevaApiError {
  error: string;
  error_description?: string;
  message?: string;
  status_code?: number;
}

/**
 * Mapping des statuts Maileva vers des statuts normalisés
 */
export const MAILEVA_STATUS_MAPPING: Record<
  MailevaRecipientStatus,
  {
    normalizedStatus: string;
    isFinal: boolean;
    description: string;
  }
> = {
  DRAFT: {
    normalizedStatus: 'created',
    isFinal: false,
    description: 'Destinataire ajouté à un envoi brouillon',
  },
  PENDING: {
    normalizedStatus: 'pending',
    isFinal: false,
    description: 'En attente de traitement',
  },
  PROCESSED: {
    normalizedStatus: 'delivered',
    isFinal: true,
    description: 'Mis sous pli et envoyé',
  },
  REJECTED: {
    normalizedStatus: 'error',
    isFinal: true,
    description: 'Destinataire rejeté (adresse invalide)',
  },
};

/**
 * Maileva API endpoints (from OpenAPI spec)
 */
export const MAILEVA_ENDPOINTS = {
  SENDINGS: '/sendings',
  SENDING_DETAIL: (sendingId: string) => `/sendings/${sendingId}`,
  RECIPIENTS: (sendingId: string) => `/sendings/${sendingId}/recipients`,
  RECIPIENT_DETAIL: (sendingId: string, recipientId: string) =>
    `/sendings/${sendingId}/recipients/${recipientId}`,
  DOCUMENTS: (sendingId: string) => `/sendings/${sendingId}/documents`,
  DOCUMENT_DETAIL: (sendingId: string, documentId: string) =>
    `/sendings/${sendingId}/documents/${documentId}`,
  DELIVERY_STATUSES: (sendingId: string, recipientId: string) =>
    `/sendings/${sendingId}/recipients/${recipientId}/delivery_statuses`,
  TRACKING: (sendingId: string, recipientId: string) =>
    `/sendings/${sendingId}/recipients/${recipientId}/delivery_statuses`,
  SUBMIT: (sendingId: string) => `/sendings/${sendingId}/submit`,
  RECIPIENTS_IMPORT: (sendingId: string) =>
    `/sendings/${sendingId}/recipients/imports`,
} as const;

/**
 * Maileva authentication endpoints (from OpenAPI spec)
 */
export const MAILEVA_AUTH_ENDPOINTS = {
  PRODUCTION:
    'https://connexion.maileva.com/auth/realms/services/protocol/openid-connect/token',
  SANDBOX:
    'https://connexion.sandbox.maileva.net/auth/realms/services/protocol/openid-connect/token',
} as const;
