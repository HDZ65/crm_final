/**
 * PSP Provider Constants & Zod Schemas
 * Defines provider metadata, configuration schemas, and UI types for payment service providers
 */

import { z } from 'zod'
import { PaymentProvider } from '@/types/billing'

// ============================================
// PSP Provider Configuration Constants
// ============================================

export interface PSPProviderConfig {
  id: PaymentProvider
  name: string
  description: string
  features: string[]
  supportsSepa: boolean
  supportsCards: boolean
  color: string // Brand color hex
}

export const PSP_PROVIDERS: PSPProviderConfig[] = [
  {
    id: PaymentProvider.STRIPE,
    name: 'Stripe',
    description: 'Global payment platform with card and bank transfer support',
    features: ['Credit Cards', 'Debit Cards', 'Bank Transfers', 'ACH', 'SEPA Direct Debit'],
    supportsSepa: true,
    supportsCards: true,
    color: '#635BFF',
  },
  {
    id: PaymentProvider.GOCARDLESS,
    name: 'GoCardless',
    description: 'Specialist in recurring payments and direct debit',
    features: ['SEPA Direct Debit', 'Mandates', 'Recurring Payments', 'Subscriptions'],
    supportsSepa: true,
    supportsCards: false,
    color: '#0B5FFF',
  },
  {
    id: PaymentProvider.SLIMPAY,
    name: 'Slimpay',
    description: 'European payment solutions with SEPA and card support',
    features: ['SEPA Direct Debit', 'SEPA Credit Transfer', 'Cards', 'Mandates'],
    supportsSepa: true,
    supportsCards: true,
    color: '#00A3E0',
  },
  {
    id: PaymentProvider.MULTISAFEPAY,
    name: 'MultiSafepay',
    description: 'Multi-channel payment gateway for European merchants',
    features: ['Cards', 'Bank Transfers', 'E-wallets', 'SEPA Direct Debit'],
    supportsSepa: true,
    supportsCards: true,
    color: '#FF6B35',
  },
  {
    id: PaymentProvider.EMERCHANTPAY,
    name: 'Emerchantpay',
    description: 'Payment processing with fraud prevention and risk management',
    features: ['Cards', 'Bank Transfers', 'E-wallets', 'Fraud Detection'],
    supportsSepa: false,
    supportsCards: true,
    color: '#1E3A8A',
  },
]

// ============================================
// PSP Configuration Form Zod Schemas
// ============================================

/**
 * GoCardless configuration schema
 * Requires: access token, environment selection, optional webhook secret
 */
export const GoCardlessConfigSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  environment: z.enum(['sandbox', 'live']),
  webhookSecret: z.string().optional(),
})

export type GoCardlessConfig = z.infer<typeof GoCardlessConfigSchema>

/**
 * Slimpay configuration schema
 * Requires: merchant ID, API key, API secret, environment
 */
export const SlimpayConfigSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
  environment: z.enum(['sandbox', 'live']),
})

export type SlimpayConfig = z.infer<typeof SlimpayConfigSchema>

/**
 * MultiSafepay configuration schema
 * Requires: API key, environment
 */
export const MultiSafepayConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  environment: z.enum(['sandbox', 'live']),
})

export type MultiSafepayConfig = z.infer<typeof MultiSafepayConfigSchema>

/**
 * Emerchantpay configuration schema
 * Requires: username, password, terminal ID, environment
 */
export const EmerchantpayConfigSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  terminalId: z.string().min(1, 'Terminal ID is required'),
  environment: z.enum(['sandbox', 'live']),
})

export type EmerchantpayConfig = z.infer<typeof EmerchantpayConfigSchema>

/**
 * Stripe configuration schema
 * Requires: publishable key, secret key, environment; optional webhook secret
 */
export const StripeConfigSchema = z.object({
  publishableKey: z.string().min(1, 'Publishable key is required'),
  secretKey: z.string().min(1, 'Secret key is required'),
  webhookSecret: z.string().optional(),
  environment: z.enum(['sandbox', 'live']),
})

export type StripeConfig = z.infer<typeof StripeConfigSchema>

/**
 * Union type for all PSP configurations
 */
export type PSPConfig =
  | GoCardlessConfig
  | SlimpayConfig
  | MultiSafepayConfig
  | EmerchantpayConfig
  | StripeConfig

/**
 * Map of provider ID to configuration schema
 * Used for dynamic form validation based on selected provider
 */
export const PSP_CONFIG_SCHEMAS: Record<PaymentProvider, z.ZodSchema> = {
  [PaymentProvider.GOCARDLESS]: GoCardlessConfigSchema,
  [PaymentProvider.SLIMPAY]: SlimpayConfigSchema,
  [PaymentProvider.MULTISAFEPAY]: MultiSafepayConfigSchema,
  [PaymentProvider.EMERCHANTPAY]: EmerchantpayConfigSchema,
  [PaymentProvider.STRIPE]: StripeConfigSchema,
  [PaymentProvider.PAYPAL]: z.object({}), // PayPal not yet implemented
}

// ============================================
// PSP Integration Card Types
// ============================================

/**
 * Display type for PSP integration status card
 * Shows connection status, environment, and last test date
 */
export interface PSPIntegrationCard {
  provider: PaymentProvider
  isConnected: boolean
  lastTestedAt?: string
  environment?: 'sandbox' | 'live'
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get PSP provider configuration by ID
 * @param id - PaymentProvider enum value
 * @returns PSPProviderConfig or undefined if not found
 */
export function getPSPProvider(id: PaymentProvider): PSPProviderConfig | undefined {
  return PSP_PROVIDERS.find((provider) => provider.id === id)
}

/**
 * Get configuration schema for a specific provider
 * @param provider - PaymentProvider enum value
 * @returns Zod schema for the provider's configuration form
 */
export function getPSPConfigSchema(provider: PaymentProvider): z.ZodSchema {
  return PSP_CONFIG_SCHEMAS[provider] || z.object({})
}

/**
 * Check if provider supports SEPA Direct Debit
 * @param provider - PaymentProvider enum value
 * @returns true if provider supports SEPA
 */
export function providerSupportsSepa(provider: PaymentProvider): boolean {
  const config = getPSPProvider(provider)
  return config?.supportsSepa ?? false
}

/**
 * Check if provider supports card payments
 * @param provider - PaymentProvider enum value
 * @returns true if provider supports cards
 */
export function providerSupportsCards(provider: PaymentProvider): boolean {
  const config = getPSPProvider(provider)
  return config?.supportsCards ?? false
}
