/**
 * Types pour l'email et OAuth
 */

// ============================================
// OAuth Providers
// ============================================

export type OAuthProvider = "google" | "microsoft" | "microsoft365" | "icloud"

export type OAuthConnectionStatus = "idle" | "connecting" | "success" | "error"

// ============================================
// OAuth Configuration
// ============================================

export interface OAuthProviderConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
}

export interface OAuthConfig {
  google: OAuthProviderConfig
  microsoft: OAuthProviderConfig
  microsoft365: OAuthProviderConfig
}

// ============================================
// Connected Accounts
// ============================================

export interface ConnectedAccount {
  provider: OAuthProvider
  email: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  boiteMailId?: string
}

// ============================================
// Email Composition
// ============================================

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  content: string
  contentType: string
}

export interface SendEmailDto {
  to: EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  subject: string
  body: string
  isHtml?: boolean
  attachments?: EmailAttachment[]
}

export interface SendEmailResponse {
  success: boolean
  messageId?: string
  error?: string
}
