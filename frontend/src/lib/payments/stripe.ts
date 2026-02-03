import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined");
    }
    stripePromise = loadStripe(key || "");
  }
  return stripePromise;
};

export const stripePromiseInstance = getStripe();

export const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

export const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#0066cc",
    colorBackground: "#ffffff",
    colorText: "#30313d",
    colorDanger: "#df1b41",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "8px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e6e6e6",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #0066cc",
      boxShadow: "0 0 0 1px #0066cc",
    },
  },
};

export const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: "Votre carte a été refusée",
  expired_card: "Votre carte a expiré",
  incorrect_cvc: "Le code CVC est incorrect",
  insufficient_funds: "Fonds insuffisants",
  invalid_card_number: "Numéro de carte invalide",
  processing_error: "Erreur de traitement, veuillez réessayer",
  invalid_expiry_month: "Mois d'expiration invalide",
  invalid_expiry_year: "Année d'expiration invalide",
  incorrect_number: "Numéro de carte incorrect",
  incomplete_number: "Numéro de carte incomplet",
  incomplete_cvc: "Code CVC incomplet",
  incomplete_expiry: "Date d'expiration incomplète",
};

export const getStripeErrorMessage = (code: string | undefined): string => {
  if (!code) return "Une erreur est survenue";
  return STRIPE_ERROR_MESSAGES[code] || "Une erreur est survenue";
};

export const formatAmount = (cents: number, currency: string = "EUR"): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
};

export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  requires3ds: "4000 0025 0000 3155",
  declined: "4000 0000 0000 9995",
  insufficientFunds: "4000 0000 0000 9995",
  expiredCard: "4000 0000 0000 0069",
};
