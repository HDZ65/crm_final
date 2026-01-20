/**
 * Frontend gRPC Client Examples
 *
 * This file demonstrates how to use the generated gRPC clients
 * in your frontend application with Connect-RPC.
 */

import { createPromiseClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";

// Import generated service definitions
import { PaymentService } from "../gen/payment_connect";
import { InvoiceService } from "../gen/invoice_connect";
import { LogisticsService } from "../gen/logistics_connect";
import { EmailService } from "../gen/email_connect";
import { NotificationService } from "../gen/notifications_connect";
import { CommissionService } from "../gen/commission_connect";

// =============================================================================
// SETUP: Create Transport and Clients
// =============================================================================

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

// Create gRPC-Web transport
const transport = createGrpcWebTransport({
  baseUrl: BASE_URL,
  // Optional: Add authentication
  // interceptors: [authInterceptor],
});

// Create typed clients for each service
export const paymentClient = createPromiseClient(PaymentService, transport);
export const invoiceClient = createPromiseClient(InvoiceService, transport);
export const logisticsClient = createPromiseClient(LogisticsService, transport);
export const emailClient = createPromiseClient(EmailService, transport);
export const notificationClient = createPromiseClient(NotificationService, transport);
export const commissionClient = createPromiseClient(CommissionService, transport);

// =============================================================================
// EXAMPLE 1: Payment Service - Stripe Checkout
// =============================================================================

export async function createStripeCheckout(amount: number, societeId: string) {
  try {
    const response = await paymentClient.createStripeCheckoutSession({
      societeId,
      amount, // in cents (e.g., 2000 = €20.00)
      currency: "eur",
      mode: "payment",
      successUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      lineItems: [
        {
          name: "Product Name",
          description: "Product description",
          amount,
          quantity: 1,
          currency: "eur",
        },
      ],
    });

    // Redirect to Stripe Checkout
    window.location.href = response.url;
  } catch (error) {
    console.error("Failed to create checkout:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 2: Payment Service - PayPal Order
// =============================================================================

export async function createPayPalOrder(amount: number, societeId: string) {
  try {
    const response = await paymentClient.createPayPalOrder({
      societeId,
      intent: "CAPTURE",
      purchaseUnits: [
        {
          amount, // in cents
          currency: "EUR",
          description: "Order description",
        },
      ],
      returnUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
    });

    return {
      orderId: response.id,
      approveUrl: response.approveUrl,
    };
  } catch (error) {
    console.error("Failed to create PayPal order:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 3: Payment Service - GoCardless Mandate Setup
// =============================================================================

export async function setupGoCardlessMandate(clientId: string, societeId: string) {
  try {
    const response = await paymentClient.setupGoCardlessMandate({
      clientId,
      societeId,
      scheme: "sepa_core", // or 'bacs', 'ach', etc.
      successRedirectUrl: `${window.location.origin}/payment/mandate-success`,
    });

    // Redirect to GoCardless
    if (response.redirectUrl) {
      window.location.href = response.redirectUrl;
    }

    return response;
  } catch (error) {
    console.error("Failed to setup mandate:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 4: Invoice Service - Create Invoice
// =============================================================================

export async function createInvoice(invoiceData: {
  customerName: string;
  customerEmail: string;
  items: Array<{ description: string; quantity: number; unitPriceHT: number }>;
}) {
  try {
    const response = await invoiceClient.createInvoice({
      customerName: invoiceData.customerName,
      customerEmail: invoiceData.customerEmail,
      customerAddress: "",
      customerSiret: "",
      customerTvaNumber: "",
      customerPhone: "",
      issueDate: new Date().toISOString(),
      deliveryDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      paymentTermsDays: 30,
      latePaymentInterestRate: 0,
      recoveryIndemnity: 40,
      vatMention: "",
      notes: "",
      items: invoiceData.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: "unit",
        unitPriceHT: item.unitPriceHT,
        vatRate: 20,
        discount: 0,
      })),
    });

    return response;
  } catch (error) {
    console.error("Failed to create invoice:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 5: Invoice Service - Download PDF
// =============================================================================

export async function downloadInvoicePdf(invoiceId: string) {
  try {
    const response = await invoiceClient.downloadInvoicePdf({
      id: invoiceId,
    });

    // Create blob and download
    const blob = new Blob([response.pdfData], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = response.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Failed to download PDF:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 6: Logistics Service - Create Expedition
// =============================================================================

export async function createExpedition(data: {
  clientBaseId: string;
  organisationId: string;
  referenceCommande: string;
}) {
  try {
    const response = await logisticsClient.createExpedition({
      organisationId: data.organisationId,
      clientBaseId: data.clientBaseId,
      transporteurCompteId: "carrier-account-id",
      referenceCommande: data.referenceCommande,
      destination: {
        line1: "123 Main St",
        postalCode: "75001",
        city: "Paris",
        country: "FR",
      },
    });

    return response;
  } catch (error) {
    console.error("Failed to create expedition:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 7: Logistics Service - Track Shipment
// =============================================================================

export async function trackShipment(trackingNumber: string) {
  try {
    const response = await logisticsClient.trackShipment({
      trackingNumber,
    });

    return {
      status: response.status,
      events: response.events,
      lastUpdated: response.lastUpdatedAt,
    };
  } catch (error) {
    console.error("Failed to track shipment:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 8: Email Service - Send Email
// =============================================================================

export async function sendEmail(data: {
  mailboxId: string;
  to: string;
  subject: string;
  htmlBody: string;
}) {
  try {
    const response = await emailClient.sendEmail({
      mailboxId: data.mailboxId,
      to: [{ email: data.to }],
      cc: [],
      bcc: [],
      subject: data.subject,
      htmlBody: data.htmlBody,
      attachments: [],
    });

    return response;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 9: Notification Service - Get Unread Count
// =============================================================================

export async function getUnreadNotificationCount(utilisateurId: string) {
  try {
    const response = await notificationClient.getUnreadCount({
      utilisateurId,
    });

    return response.unread;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}

// =============================================================================
// EXAMPLE 10: Notification Service - Mark All as Read
// =============================================================================

export async function markAllNotificationsAsRead(utilisateurId: string) {
  try {
    await notificationClient.markAllAsRead({
      utilisateurId,
    });
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 11: Commission Service - Calculate Commission
// =============================================================================

export async function calculateCommission(data: {
  organisationId: string;
  apporteurId: string;
  contratId: string;
  typeProduit: string;
  montantBase: string;
  periode: string;
}) {
  try {
    const response = await commissionClient.calculerCommission({
      organisationId: data.organisationId,
      apporteurId: data.apporteurId,
      contratId: data.contratId,
      typeProduit: data.typeProduit,
      profilRemuneration: "STANDARD",
      montantBase: data.montantBase,
      periode: data.periode,
    });

    return {
      commission: response.commission,
      baremeApplique: response.baremeApplique,
      primes: response.primes,
      montantTotal: response.montantTotal,
    };
  } catch (error) {
    console.error("Failed to calculate commission:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 12: Commission Service - Generate Bordereau
// =============================================================================

export async function generateBordereau(data: {
  organisationId: string;
  apporteurId: string;
  periode: string;
}) {
  try {
    const response = await commissionClient.genererBordereau({
      organisationId: data.organisationId,
      apporteurId: data.apporteurId,
      periode: data.periode,
    });

    return {
      bordereau: response.bordereau,
      summary: response.summary,
    };
  } catch (error) {
    console.error("Failed to generate bordereau:", error);
    throw error;
  }
}

// =============================================================================
// EXAMPLE 13: React Hook - usePaymentClient
// =============================================================================

import { useState, useCallback } from "react";

export function usePaymentClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createCheckout = useCallback(async (amount: number, societeId: string) => {
    setLoading(true);
    setError(null);
    try {
      await createStripeCheckout(amount, societeId);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayPal = useCallback(async (amount: number, societeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createPayPalOrder(amount, societeId);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCheckout,
    createPayPal,
  };
}

// =============================================================================
// EXAMPLE 14: React Component - PaymentButton
// =============================================================================

export function PaymentButton({ amount, societeId }: { amount: number; societeId: string }) {
  const { loading, error, createCheckout } = usePaymentClient();

  return (
    <div>
      <button
        onClick={() => createCheckout(amount, societeId)}
        disabled={loading}
      >
        {loading ? "Processing..." : "Pay with Stripe"}
      </button>
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
    </div>
  );
}

// =============================================================================
// EXAMPLE 15: Authentication Interceptor (Optional)
// =============================================================================

import { Interceptor } from "@connectrpc/connect";

export function createAuthInterceptor(getToken: () => string | null): Interceptor {
  return (next) => async (req) => {
    const token = getToken();
    if (token) {
      req.header.set("Authorization", `Bearer ${token}`);
    }
    return await next(req);
  };
}

// Usage:
// const transport = createGrpcWebTransport({
//   baseUrl: BASE_URL,
//   interceptors: [createAuthInterceptor(() => localStorage.getItem("token"))],
// });
