import { z } from "zod"
import type { PspType } from "./psp-providers"

const stripeSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  stripePublishableKey: z.string().min(1, "Clé publique requise"),
  stripeSecretKey: z.string().min(1, "Clé secrète requise"),
  stripeWebhookSecret: z.string().optional(),
  isTestMode: z.boolean().default(true),
})

const gocardlessSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  accessToken: z.string().min(1, "Access token requis"),
  organisationId: z.string().optional(),
  webhookSecret: z.string().optional(),
  isSandbox: z.boolean().default(true),
})

const slimpaySchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  creditorReference: z.string().min(1, "Référence créancier requise"),
  appName: z.string().min(1, "App name requis"),
  appSecret: z.string().min(1, "App secret requis"),
  webhookSecret: z.string().optional(),
  isSandbox: z.boolean().default(true),
})

const multisafepaySchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  apiKey: z.string().min(1, "Clé API requise"),
  isSandbox: z.boolean().default(true),
})

const emerchantpaySchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  apiLogin: z.string().min(1, "Login API requis"),
  apiPassword: z.string().min(1, "Mot de passe API requis"),
  terminalToken: z.string().min(1, "Token terminal requis"),
  webhookPublicKey: z.string().optional(),
  isSandbox: z.boolean().default(true),
})

const paypalSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  clientId: z.string().min(1, "Client ID requis"),
  clientSecret: z.string().min(1, "Client secret requis"),
  webhookId: z.string().optional(),
  isSandbox: z.boolean().default(true),
})

export function getPspSchema(pspType: PspType) {
  switch (pspType) {
    case "stripe": return stripeSchema
    case "gocardless": return gocardlessSchema
    case "slimpay": return slimpaySchema
    case "multisafepay": return multisafepaySchema
    case "emerchantpay": return emerchantpaySchema
    case "paypal": return paypalSchema
  }
}

export type StripeFormData = z.infer<typeof stripeSchema>
export type GoCardlessFormData = z.infer<typeof gocardlessSchema>
export type SlimpayFormData = z.infer<typeof slimpaySchema>
export type MultiSafepayFormData = z.infer<typeof multisafepaySchema>
export type EmerchantpayFormData = z.infer<typeof emerchantpaySchema>
export type PaypalFormData = z.infer<typeof paypalSchema>
