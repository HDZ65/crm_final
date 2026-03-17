import { YousignStatus } from '../contrat/enums/yousign-status.enum';

// Re-export for convenience
export { YousignStatus as SignatureRequestStatus };

// ============================================================================
// Yousign V3 API Types
// ============================================================================

/** Signer info for a signature request */
export interface YousignSigner {
  info: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    locale?: string;
  };
  signature_level?: 'electronic_signature' | 'advanced_electronic_signature' | 'qualified_electronic_signature';
  signature_authentication_mode?: 'otp_email' | 'otp_sms' | 'no_otp';
  redirect_urls?: {
    success?: string;
    error?: string;
  };
}

/** Document attached to a signature request */
export interface YousignDocument {
  id: string;
  nature: 'signable_document' | 'attachment';
  filename: string;
  content_type: string;
  sha256: string;
  is_signed: boolean;
  total_pages: number;
  created_at: string;
  updated_at: string;
}

/** Full signature request from Yousign V3 API */
export interface YousignSignatureRequest {
  id: string;
  status: YousignStatus;
  name: string;
  delivery_mode: 'email' | 'none';
  timezone: string;
  ordered_signers: boolean;
  created_at: string;
  updated_at: string;
  expired_at?: string;
  external_id?: string;
  signers: YousignSignerResponse[];
  documents: YousignDocument[];
  email_notification?: {
    sender?: { type: 'organization' | 'custom'; custom_name?: string };
    custom_note?: string;
  };
}

/** Signer response (with id) returned by Yousign */
export interface YousignSignerResponse {
  id: string;
  info: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    locale?: string;
  };
  status: string;
  signature_link?: string;
  signature_link_expiration_date?: string;
}

// ============================================================================
// Request DTOs for creating signature requests
// ============================================================================

/** Payload to create a new signature request */
export interface CreateSignatureRequestPayload {
  name: string;
  delivery_mode: 'email' | 'none';
  timezone?: string;
  ordered_signers?: boolean;
  external_id?: string;
  signers: YousignSigner[];
  email_notification?: {
    sender?: { type: 'organization' | 'custom'; custom_name?: string };
    custom_note?: string;
  };
}

/** Payload for uploading a document (metadata portion) */
export interface UploadDocumentPayload {
  file: Buffer;
  filename: string;
  nature?: 'signable_document' | 'attachment';
}
