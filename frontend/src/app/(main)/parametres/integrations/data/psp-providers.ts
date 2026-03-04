// PSP type matches backend entity identifiers
export type PspType = "stripe" | "gocardless" | "emerchantpay" | "slimpay" | "multisafepay" | "paypal"

export interface PspFieldConfig {
  name: string
  label: string
  type: "text" | "password"
  required: boolean
  placeholder: string
}

export interface PspProviderConfig {
  id: PspType
  name: string
  description: string
  icon: string       // lucide-react icon name
  color: string      // brand color for icon container bg
  fields: PspFieldConfig[]
  testEndpointHint: string
}

export const PSP_PROVIDERS: PspProviderConfig[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Paiements par carte bancaire et abonnements",
    icon: "CreditCard",
    color: "bg-indigo-100",
    fields: [
      { name: "stripePublishableKey", label: "Clé publique", type: "text", required: true, placeholder: "pk_live_..." },
      { name: "stripeSecretKey", label: "Clé secrète", type: "password", required: true, placeholder: "sk_live_..." },
      { name: "stripeWebhookSecret", label: "Secret webhook (recommandé)", type: "password", required: false, placeholder: "whsec_..." },
    ],
    testEndpointHint: "Stripe GET /v1/balance",
  },
  {
    id: "gocardless",
    name: "GoCardless",
    description: "Prélèvements SEPA et mandats directs",
    icon: "Building2",
    color: "bg-blue-100",
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true, placeholder: "live_..." },
      { name: "organisationId", label: "Organisation ID", type: "text", required: false, placeholder: "OR..." },
      { name: "webhookSecret", label: "Secret webhook", type: "password", required: false, placeholder: "..." },
    ],
    testEndpointHint: "GoCardless GET /",
  },
  {
    id: "slimpay",
    name: "Slimpay",
    description: "Prélèvements SEPA en France",
    icon: "Banknote",
    color: "bg-green-100",
    fields: [
      { name: "creditorReference", label: "Référence créancier", type: "text", required: true, placeholder: "creditor_ref_..." },
      { name: "appName", label: "App Name", type: "text", required: true, placeholder: "myapp" },
      { name: "appSecret", label: "App Secret", type: "password", required: true, placeholder: "..." },
      { name: "webhookSecret", label: "Secret webhook", type: "password", required: false, placeholder: "..." },
    ],
    testEndpointHint: "Slimpay OAuth /oauth/token",
  },
  {
    id: "multisafepay",
    name: "MultiSafepay",
    description: "Passerelle de paiement multidevise",
    icon: "Globe",
    color: "bg-orange-100",
    fields: [
      { name: "apiKey", label: "Clé API", type: "password", required: true, placeholder: "..." },
    ],
    testEndpointHint: "MultiSafepay GET /v1/json/gateways",
  },
  {
    id: "emerchantpay",
    name: "Emerchantpay",
    description: "Solutions de paiement internationales",
    icon: "Landmark",
    color: "bg-purple-100",
    fields: [
      { name: "apiLogin", label: "Login API", type: "text", required: true, placeholder: "..." },
      { name: "apiPassword", label: "Mot de passe API", type: "password", required: true, placeholder: "..." },
      { name: "terminalToken", label: "Token terminal", type: "password", required: true, placeholder: "..." },
      { name: "webhookPublicKey", label: "Clé publique webhook", type: "password", required: false, placeholder: "..." },
    ],
    testEndpointHint: "Emerchantpay status check",
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Paiements PayPal et portefeuille digital",
    icon: "Wallet",
    color: "bg-yellow-100",
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true, placeholder: "A..." },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true, placeholder: "..." },
      { name: "webhookId", label: "ID Webhook", type: "text", required: false, placeholder: "..." },
    ],
    testEndpointHint: "PayPal POST /v1/oauth2/token",
  },
]
