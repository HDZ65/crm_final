import { translateBackendError, extractValidationErrors } from "../errors/messages";

/**
 * REST API CLIENT — PARTIAL MIGRATION STATUS (Wave 3 Task 8)
 *
 * MIGRATED TO gRPC (Tasks 4-8):
 * - Contract orchestration (activateContrat, suspendContrat, etc.)
 * - Stripe payments (8 endpoints)
 * - PSP accounts (6 PSPs)
 * - GoCardless (mandates, payments, subscriptions)
 * - Payment intents, events, schedules
 * - Maileva / logistics (labels, tracking, pricing, address validation)
 * - Auth signup (users.create via gRPC)
 *
 * DEFERRED — NOT in Wave 3 scope (25 hooks still using REST):
 * - Commissions (12 hooks): apporteurs, baremes, bordereaux, config, engine,
 *   mutations, commissions, lignes, paliers, reprises, statuts
 * - Stats (6 hooks): alerts, ca-evolution, commercial-kpis, company-stats,
 *   dashboard-kpis, product-distribution
 * - Contracts (1 hook): use-contrats
 * - Factures (1 hook): index
 * - Logistics (1 hook): use-expeditions
 * - Taches (3 hooks): regles-relance, tache-notifications, taches
 * - Auth (1 hook): useAuth
 * - Core (1 hook): use-error-handler (ApiError type)
 *
 * REST EXCEPTIONS (will NOT be migrated):
 * - AI health check (hooks/ai/use-ai-health.ts) — browser-side HTTP polling
 * - AI health context (contexts/ai-health-context.tsx) — browser-side HTTP polling
 * - AI briefing (components/dashboard/greeting-briefing.tsx) — SSE streaming
 *
 * These deferred hooks will be migrated in future waves (Wave 4-5).
 *
 * REST→gRPC MIGRATION PLAN (original)
 *
 * This ApiClient is a temporary REST adapter for legacy endpoints.
 * All endpoints below are scheduled for migration to gRPC in Waves 3-5.
 * 
 * MIGRATION INVENTORY (35 controllers):
 * 
 * DEDICATED PAGE CONTROLLERS (15):
 * - permission.controller (core) → organisations/users.proto
 * - role-permission.controller (core) → organisations/users.proto
 * - partenaire-marque-blanche.controller (core) → organisations/organisations.proto
 * - subscription.controller (commercial) → subscriptions/subscriptions.proto
 * - subscription-plan.controller (commercial) → subscriptions/subscriptions.proto
 * - formule-produit.controller (commercial) → products/products.proto
 * - woocommerce.controller (commercial) → woocommerce/woocommerce.proto
 * - mailbox.controller (engagement) → email/email.proto
 * - meeting.controller (engagement) → agenda/agenda.proto
 * - call-summary.controller (engagement) → agenda/agenda.proto
 * - routing.controller (finance) → payments/payment.proto
 * - archive.controller (finance) → payments/payment.proto
 * - alert.controller (finance) → payments/payment.proto
 * - export.controller (finance) → payments/payment.proto
 * - fulfillment-batch.controller (logistics) → fulfillment/fulfillment.proto
 * 
 * EMBEDDED SECTION CONTROLLERS (20):
 * - adresse.controller (core) → clients/clients.proto
 * - client-entreprise.controller (core) → clients/clients.proto
 * - client-partenaire.controller (core) → clients/clients.proto
 * - statut-client.controller (core) → clients/clients.proto
 * - condition-paiement.controller (core) → clients/clients.proto
 * - emission-facture.controller (core) → clients/clients.proto
 * - facturation-par.controller (core) → clients/clients.proto
 * - periode-facturation.controller (core) → clients/clients.proto
 * - transporteur-compte.controller (core) → clients/clients.proto
 * - boite-mail.controller (core) → email/email.proto
 * - piece-jointe.controller (core) → documents/documents.proto
 * - theme-marque.controller (core) → organisations/organisations.proto
 * - statut-partenaire.controller (core) → organisations/organisations.proto
 * - calendar-event.controller (engagement) → agenda/agenda.proto
 * - preference.controller (commercial) → subscriptions/subscriptions.proto
 * - multisafepay.controller (finance) → payments/payment.proto
 * - slimpay.controller (finance) → payments/payment.proto
 * - status-mapping.controller (finance) → payments/payment.proto
 * - fulfillment-cutoff.controller (logistics) → fulfillment/fulfillment.proto
 * - carrier.controller (logistics) → logistics/logistics.proto
 * 
  * REST CONSUMERS (35 imports):
  * - hooks/auth/useAuth.ts
  * - hooks/commissions/* (13 files)
  * - hooks/contracts/* (2 files)
  * - hooks/core/* (2 files)
  * - hooks/email/* (2 files)
  * - hooks/factures/index.ts
  * - hooks/logistics/use-expeditions.ts
  * - hooks/payment/* (3 files)
  * - hooks/stats/* (6 files)
  * - components/payment/schedule-form.tsx
  * 
  * DIRECT BACKEND_API_URL REFERENCES (14):
  * - app/api/ai/health/route.ts
  * - components/dashboard/greeting-briefing.tsx
  * - contexts/ai-health-context.tsx
  * - hooks/ai/use-ai-health.ts
  * - hooks/email/use-maileva.ts
  * - hooks/email/use-oauth-email.ts
  * - lib/payments/stripe.ts
  * - stores/ai-assistant-store.ts
 * 
 * PROTO COMPLETENESS: ✓ ALL 35 CONTROLLERS HAVE PROTO FILES
 * - organisations/users.proto (45 RPCs)
 * - organisations/organisations.proto (50 RPCs)
 * - subscriptions/subscriptions.proto (41 RPCs)
 * - products/products.proto (50 RPCs)
 * - woocommerce/woocommerce.proto (16 RPCs)
 * - email/email.proto (21 RPCs)
 * - agenda/agenda.proto (21 RPCs)
 * - payments/payment.proto (80 RPCs)
 * - fulfillment/fulfillment.proto (15 RPCs)
 * - clients/clients.proto (27 RPCs)
 * - documents/documents.proto (19 RPCs)
 * - logistics/logistics.proto (23 RPCs)
 * 
 * MIGRATION TIMELINE:
 * - Wave 3 (Tasks 4-8): Core infrastructure & gRPC client setup
 * - Wave 4 (Tasks 9-23): DEDICATED PAGE controllers (15 controllers)
 * - Wave 5 (Tasks 24-43): EMBEDDED SECTION controllers (20 controllers)
 * 
 * NO BLOCKING ISSUES - All proto files exist with RPC methods defined.
 */

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  /** Message d'erreur traduit pour l'utilisateur */
  public userMessage: string;
  /** Erreurs de validation par champ (si applicable) */
  public validationErrors: Record<string, string[]> | null;

  constructor(message: string, public status: number, public response?: unknown) {
    super(message);
    this.name = "ApiError";
    this.userMessage = translateBackendError(message, status);
    this.validationErrors = extractValidationErrors(response);
  }

  /**
   * Retourne le message a afficher a l'utilisateur
   */
  getUserMessage(): string {
    return this.userMessage;
  }

  /**
   * Verifie si l'erreur contient des erreurs de validation
   */
  hasValidationErrors(): boolean {
    return (
      this.validationErrors !== null &&
      Object.keys(this.validationErrors).length > 0
    );
  }

  /**
   * Retourne les erreurs de validation pour un champ specifique
   */
  getFieldErrors(fieldName: string): string[] {
    return this.validationErrors?.[fieldName] || [];
  }
}

class ApiClient {
  private token: string | null = null;
  private onUnauthorized?: () => void;

  setToken(token: string | null) {
    this.token = token;
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorized = callback;
  }

  async request(endpoint: string, options: ApiOptions = {}) {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (!skipAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (response.status === 401) {
        if (process.env.NODE_ENV !== "development") {
          console.error("Unauthorized - token may be expired or invalid");
        }
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new ApiError("Unauthorized", 401);
      }

      if (response.status === 403) {
        throw new ApiError("Forbidden - insufficient permissions", 403);
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;

        try {
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = (await response.text()) || errorMessage;
          }
        } catch {
          // Ignore parsing errors
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (process.env.NODE_ENV === "development") {
        console.debug(`[API] Request failed for ${endpoint}:`, error);
      } else {
        console.error(`API request failed for ${endpoint}:`, error);
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Network error",
        0
      );
    }
  }

  async get<T = unknown>(endpoint: string, options?: ApiOptions): Promise<T> {
    return this.request(endpoint, { ...options, method: "GET" }) as Promise<T>;
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>;
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>;
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }) as Promise<T>;
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: ApiOptions
  ): Promise<T> {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    }) as Promise<T>;
  }

  async getBlob(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<Blob | null> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (!skipAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method: "GET",
        headers,
      });

      if (response.status === 401) {
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw new ApiError("Unauthorized", 401);
      }

      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
      }

      return await response.blob();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (process.env.NODE_ENV === "development") {
        console.debug(`[API] Blob request failed for ${endpoint}:`, error);
      } else {
        console.error(`API blob request failed for ${endpoint}:`, error);
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Network error",
        0
      );
    }
  }
}

const apiClient = new ApiClient();

export default apiClient;

export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiOptions): Promise<T> =>
    apiClient.get<T>(endpoint, options),
  post: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<T> => apiClient.post<T>(endpoint, data, options),
  put: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<T> => apiClient.put<T>(endpoint, data, options),
  patch: <T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: ApiOptions
  ): Promise<T> => apiClient.patch<T>(endpoint, data, options),
  delete: <T = unknown>(endpoint: string, options?: ApiOptions): Promise<T> =>
    apiClient.delete<T>(endpoint, options),
  getBlob: (endpoint: string, options?: ApiOptions) =>
    apiClient.getBlob(endpoint, options),
  setToken: (token: string | null) => apiClient.setToken(token),
  setOnUnauthorized: (callback: () => void) =>
    apiClient.setOnUnauthorized(callback),
};
