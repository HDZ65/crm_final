# Guide d'intégration PayPal - Frontend

Ce guide explique comment intégrer PayPal dans votre application frontend (React, Vue, Angular, etc.) avec le backend CRM.

## Table des matières

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Scénarios d'intégration](#scénarios-dintégration)
   - [Paiement unique (Checkout)](#1-paiement-unique-avec-paypal-checkout)
   - [Paiement avec boutons PayPal](#2-paiement-avec-boutons-paypal-sdk)
   - [Abonnements](#3-abonnements-paypal)
4. [Endpoints API disponibles](#endpoints-api-disponibles)
5. [Gestion des erreurs](#gestion-des-erreurs)
6. [Exemples complets](#exemples-complets)
7. [Tests](#tests)

---

## Installation

### React / Vue.js / Angular

PayPal utilise un SDK JavaScript chargé dynamiquement. Pas besoin d'installer de package npm.

Optionnel : Pour TypeScript, installez les types :
```bash
npm install --save-dev @paypal/paypal-js
```

---

## Configuration

### Variables d'environnement frontend

```env
# .env ou .env.local
VITE_PAYPAL_CLIENT_ID=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxB
VITE_API_URL=http://localhost:3000
```

> **Note** : Le `clientId` PayPal est public et peut être exposé côté frontend. Le `clientSecret` reste uniquement côté backend.

### Charger le SDK PayPal

```typescript
// lib/paypal.ts
export function loadPayPalScript(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
  });
}
```

---

## Scénarios d'intégration

### 1. Paiement unique avec PayPal Checkout

Le flow le plus simple : redirection vers PayPal via le backend.

#### Flow

```
[Bouton Payer] → [API Backend: créer ordre] → [Redirection PayPal] → [Approbation] → [Capture] → [Succès]
```

#### Exemple React (Redirection simple)

```tsx
// components/PayPalRedirectButton.tsx
import { useState } from 'react';

interface PayPalRedirectButtonProps {
  amount: number;        // Montant en centimes (ex: 2000 = 20.00€)
  description?: string;
  societeId: string;     // ID de la société (multi-tenant)
}

export function PayPalRedirectButton({
  amount,
  description,
  societeId
}: PayPalRedirectButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayPal = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/paypal/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          societeId,
          intent: 'CAPTURE',
          purchaseUnits: [{
            amount,
            currency: 'EUR',
            description: description || 'Achat',
          }],
          returnUrl: `${window.location.origin}/payment/paypal/success`,
          cancelUrl: `${window.location.origin}/payment/paypal/cancel`,
        }),
      });

      const data = await response.json();

      if (data.approveUrl) {
        // Redirection vers PayPal pour approbation
        window.location.href = data.approveUrl;
      } else {
        throw new Error('Pas d\'URL d\'approbation');
      }
    } catch (error) {
      console.error('Erreur PayPal:', error);
      alert('Erreur lors de la création du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayPal}
      disabled={loading}
      className="paypal-button"
      style={{
        backgroundColor: '#0070ba',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '4px',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? 'Chargement...' : `Payer ${(amount / 100).toFixed(2)}€ avec PayPal`}
    </button>
  );
}
```

#### Page de retour (succès)

```tsx
// pages/PayPalSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface CaptureResult {
  id: string;
  status: string;
  payer?: {
    emailAddress?: string;
    name?: {
      givenName?: string;
      surname?: string;
    };
  };
}

export function PayPalSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PayPal ajoute ces paramètres à l'URL de retour
  const token = searchParams.get('token');  // C'est l'orderId PayPal

  useEffect(() => {
    if (!token) {
      setError('Token manquant');
      setLoading(false);
      return;
    }

    // Capturer le paiement
    const captureOrder = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/paypal/orders/${token}/capture`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              societeId: localStorage.getItem('societeId'), // ou depuis votre state
            }),
          }
        );

        const data = await response.json();

        if (data.status === 'COMPLETED') {
          setResult(data);
        } else {
          setError(`Statut inattendu: ${data.status}`);
        }
      } catch (err) {
        setError('Erreur lors de la capture du paiement');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    captureOrder();
  }, [token]);

  if (loading) {
    return (
      <div className="loading">
        <p>Finalisation du paiement en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <h1>Erreur</h1>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  return (
    <div className="success-page">
      <h1>Paiement réussi !</h1>
      <p>Merci pour votre achat, {result?.payer?.name?.givenName}.</p>
      <p>Un email de confirmation a été envoyé à {result?.payer?.emailAddress}.</p>
      <p>Référence: {result?.id}</p>
      <button onClick={() => navigate('/')}>Retour à l'accueil</button>
    </div>
  );
}
```

---

### 2. Paiement avec Boutons PayPal (SDK)

Intégration des boutons PayPal natifs directement dans votre page.

#### Flow

```
[Afficher boutons PayPal] → [Click] → [Popup PayPal] → [Approbation] → [Capture automatique] → [Succès]
```

#### Exemple React avec SDK PayPal

```tsx
// components/PayPalButtons.tsx
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonsProps {
  amount: number;           // Montant en centimes
  currency?: string;
  description?: string;
  societeId: string;
  onSuccess?: (orderId: string, details: any) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

export function PayPalButtons({
  amount,
  currency = 'EUR',
  description,
  societeId,
  onSuccess,
  onError,
  onCancel,
}: PayPalButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);

  // Charger le SDK PayPal
  useEffect(() => {
    const loadScript = () => {
      if (window.paypal) {
        setSdkReady(true);
        setLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=${currency}&intent=capture`;
      script.async = true;
      script.onload = () => {
        setSdkReady(true);
        setLoading(false);
      };
      script.onerror = () => {
        setLoading(false);
        onError?.(new Error('Impossible de charger PayPal'));
      };
      document.body.appendChild(script);
    };

    loadScript();
  }, [currency, onError]);

  // Rendre les boutons PayPal
  useEffect(() => {
    if (!sdkReady || !containerRef.current || !window.paypal) return;

    // Nettoyer les boutons existants
    containerRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45,
      },

      // Créer l'ordre via le backend
      createOrder: async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/paypal/orders`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                societeId,
                intent: 'CAPTURE',
                purchaseUnits: [{
                  amount,
                  currency,
                  description,
                }],
                returnUrl: window.location.href,
                cancelUrl: window.location.href,
              }),
            }
          );

          const data = await response.json();
          return data.id; // Retourne l'orderId à PayPal
        } catch (error) {
          console.error('Erreur création ordre:', error);
          throw error;
        }
      },

      // Capturer le paiement après approbation
      onApprove: async (data: { orderID: string }) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/paypal/orders/${data.orderID}/capture`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ societeId }),
            }
          );

          const details = await response.json();

          if (details.status === 'COMPLETED') {
            onSuccess?.(data.orderID, details);
          } else {
            onError?.(new Error(`Statut inattendu: ${details.status}`));
          }
        } catch (error) {
          onError?.(error);
        }
      },

      onCancel: () => {
        onCancel?.();
      },

      onError: (err: any) => {
        console.error('PayPal Error:', err);
        onError?.(err);
      },
    }).render(containerRef.current);
  }, [sdkReady, amount, currency, description, societeId, onSuccess, onError, onCancel]);

  if (loading) {
    return <div>Chargement de PayPal...</div>;
  }

  return <div ref={containerRef} style={{ minHeight: '150px' }} />;
}
```

#### Utilisation

```tsx
// pages/Checkout.tsx
import { PayPalButtons } from '../components/PayPalButtons';
import { useNavigate } from 'react-router-dom';

export function Checkout() {
  const navigate = useNavigate();
  const societeId = 'your-societe-id'; // depuis votre contexte/state

  return (
    <div className="checkout-page">
      <h1>Finaliser votre commande</h1>

      <div className="order-summary">
        <p>Total: 29.99€</p>
      </div>

      <div className="payment-methods">
        <h2>Payer avec PayPal</h2>

        <PayPalButtons
          amount={2999}  // 29.99€ en centimes
          currency="EUR"
          description="Commande #12345"
          societeId={societeId}
          onSuccess={(orderId, details) => {
            console.log('Paiement réussi:', orderId, details);
            navigate(`/order/confirmation?orderId=${orderId}`);
          }}
          onError={(error) => {
            console.error('Erreur PayPal:', error);
            alert('Erreur lors du paiement');
          }}
          onCancel={() => {
            console.log('Paiement annulé');
          }}
        />
      </div>
    </div>
  );
}
```

---

### 3. Abonnements PayPal

Pour les paiements récurrents avec PayPal Subscriptions.

> **Note** : Les abonnements PayPal nécessitent de créer des "Plans" côté PayPal. Cette fonctionnalité sera ajoutée dans une future version.

#### Flow prévu

```
[Créer Plan] → [Créer Subscription] → [Redirect PayPal] → [Approbation] → [Webhook: activation]
```

---

## Endpoints API disponibles

### Configuration Compte PayPal (Admin)

```typescript
// POST /paypal-accounts
// Créer un compte PayPal pour une société

interface CreatePaypalAccountRequest {
  societeId: string;           // ID de la société
  nom: string;                 // Nom du compte (ex: "PayPal Production")
  clientId: string;            // PayPal Client ID
  clientSecret: string;        // PayPal Client Secret (encrypté côté backend)
  webhookId?: string;          // ID du webhook PayPal (optionnel)
  environment: 'sandbox' | 'live';
  actif?: boolean;             // Activer le compte (défaut: true)
}

interface PaypalAccountResponse {
  id: string;
  societeId: string;
  nom: string;
  clientId: string;            // Le secret n'est JAMAIS retourné
  environment: 'sandbox' | 'live';
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET /paypal-accounts
// Lister tous les comptes

// GET /paypal-accounts/:id
// Récupérer un compte par ID

// GET /paypal-accounts/societe/:societeId
// Récupérer le compte d'une société

// PUT /paypal-accounts/:id
// Modifier un compte

// DELETE /paypal-accounts/:id
// Supprimer un compte
```

### Orders (Paiements)

```typescript
// POST /paypal/orders
// Créer un ordre PayPal

interface CreatePaypalOrderRequest {
  societeId: string;           // ID de la société (pour récupérer les credentials)
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchaseUnits: Array<{
    referenceId?: string;      // Votre référence interne
    amount: number;            // Montant en centimes
    currency?: string;         // 'EUR', 'USD', etc. (défaut: 'EUR')
    description?: string;
    customId?: string;         // ID personnalisé (ex: orderId interne)
    invoiceId?: string;        // Numéro de facture
  }>;
  returnUrl: string;           // URL après approbation
  cancelUrl: string;           // URL si annulation
  metadata?: Record<string, string>;
}

interface PaypalOrderResponse {
  id: string;                  // ID de l'ordre PayPal
  status: string;              // 'CREATED', 'APPROVED', 'COMPLETED', etc.
  approveUrl?: string;         // URL de redirection pour approbation
  captureUrl?: string;         // URL de capture (après approbation)
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// GET /paypal/orders/:id
// Récupérer un ordre
// Header requis: x-societe-id

// POST /paypal/orders/:id/capture
// Capturer un ordre approuvé

interface CapturePaypalOrderRequest {
  societeId: string;
}

interface PaypalCaptureResponse {
  id: string;
  status: string;              // 'COMPLETED' si succès
  payer?: {
    emailAddress?: string;
    payerId?: string;
    name?: {
      givenName?: string;
      surname?: string;
    };
  };
  purchaseUnits?: Array<{
    referenceId?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currencyCode: string;
          value: string;
        };
      }>;
    };
  }>;
}

// POST /paypal/orders/:id/authorize
// Autoriser un ordre (sans capture immédiate)
// Header requis: x-societe-id
```

### Webhooks

```typescript
// POST /paypal/webhooks
// Endpoint pour recevoir les webhooks PayPal
// (configuré automatiquement, pas d'appel frontend)

// Événements gérés:
// - CHECKOUT.ORDER.APPROVED
// - CHECKOUT.ORDER.COMPLETED
// - PAYMENT.CAPTURE.COMPLETED
// - PAYMENT.CAPTURE.DENIED
// - PAYMENT.CAPTURE.PENDING
// - PAYMENT.CAPTURE.REFUNDED
// - BILLING.SUBSCRIPTION.CREATED
// - BILLING.SUBSCRIPTION.ACTIVATED
// - BILLING.SUBSCRIPTION.CANCELLED
// - PAYMENT.SALE.COMPLETED
```

---

## Gestion des erreurs

### Codes d'erreur PayPal courants

```typescript
// Erreurs courantes
const PAYPAL_ERRORS: Record<string, string> = {
  'INSTRUMENT_DECLINED': 'Le moyen de paiement a été refusé',
  'PAYER_ACTION_REQUIRED': 'Action requise de la part du payeur',
  'INTERNAL_SERVER_ERROR': 'Erreur serveur PayPal, veuillez réessayer',
  'INVALID_CURRENCY_CODE': 'Devise non supportée',
  'INVALID_PARAMETER_VALUE': 'Paramètre invalide',
  'PERMISSION_DENIED': 'Accès refusé',
  'RESOURCE_NOT_FOUND': 'Ressource non trouvée',
};

// Composant de gestion d'erreur
function PayPalError({ error }: { error: any }) {
  const getMessage = () => {
    if (typeof error === 'string') {
      return PAYPAL_ERRORS[error] || error;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  };

  return (
    <div className="paypal-error" style={{ color: '#c0392b', padding: '10px' }}>
      <p>{getMessage()}</p>
    </div>
  );
}
```

### Gestion des statuts d'ordre

```typescript
// Statuts possibles d'un ordre PayPal
type OrderStatus =
  | 'CREATED'      // Ordre créé, en attente d'approbation
  | 'SAVED'        // Ordre sauvegardé
  | 'APPROVED'     // Approuvé par le payeur, prêt pour capture
  | 'VOIDED'       // Annulé
  | 'COMPLETED'    // Paiement capturé avec succès
  | 'PAYER_ACTION_REQUIRED'; // Action requise

// Hook personnalisé pour gérer l'état
function usePayPalOrderStatus(orderId: string, societeId: string) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/paypal/orders/${orderId}`,
          {
            headers: {
              'x-societe-id': societeId,
            },
          }
        );
        const data = await res.json();
        setStatus(data.status);
      } catch (error) {
        console.error('Erreur vérification statut:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [orderId, societeId]);

  return {
    status,
    loading,
    isCreated: status === 'CREATED',
    isApproved: status === 'APPROVED',
    isCompleted: status === 'COMPLETED',
    needsAction: status === 'PAYER_ACTION_REQUIRED',
  };
}
```

---

## Exemples complets

### Vue.js 3 (Composition API)

```vue
<!-- components/PayPalCheckout.vue -->
<template>
  <div class="paypal-checkout">
    <div v-if="loading" class="loading">
      Chargement de PayPal...
    </div>

    <div ref="paypalContainer" class="paypal-buttons"></div>

    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="success" class="success">
      <p>Paiement réussi !</p>
      <p>Référence: {{ orderId }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  amount: number;
  currency?: string;
  societeId: string;
}>();

const emit = defineEmits<{
  (e: 'success', orderId: string, details: any): void;
  (e: 'error', error: any): void;
  (e: 'cancel'): void;
}>();

const paypalContainer = ref<HTMLElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const success = ref(false);
const orderId = ref<string | null>(null);

onMounted(async () => {
  await loadPayPalScript();
  renderButtons();
});

async function loadPayPalScript() {
  if ((window as any).paypal) {
    loading.value = false;
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=${props.currency || 'EUR'}`;
    script.onload = () => {
      loading.value = false;
      resolve();
    };
    script.onerror = () => {
      loading.value = false;
      error.value = 'Impossible de charger PayPal';
      reject();
    };
    document.body.appendChild(script);
  });
}

function renderButtons() {
  if (!paypalContainer.value || !(window as any).paypal) return;

  (window as any).paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'blue',
      shape: 'rect',
    },

    createOrder: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/paypal/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societeId: props.societeId,
          intent: 'CAPTURE',
          purchaseUnits: [{
            amount: props.amount,
            currency: props.currency || 'EUR',
          }],
          returnUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });
      const data = await response.json();
      return data.id;
    },

    onApprove: async (data: { orderID: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/paypal/orders/${data.orderID}/capture`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ societeId: props.societeId }),
        }
      );
      const details = await response.json();

      if (details.status === 'COMPLETED') {
        success.value = true;
        orderId.value = data.orderID;
        emit('success', data.orderID, details);
      } else {
        error.value = `Statut: ${details.status}`;
        emit('error', details);
      }
    },

    onCancel: () => {
      emit('cancel');
    },

    onError: (err: any) => {
      error.value = 'Erreur PayPal';
      emit('error', err);
    },
  }).render(paypalContainer.value);
}
</script>

<style scoped>
.paypal-checkout {
  max-width: 400px;
  margin: 0 auto;
}
.paypal-buttons {
  min-height: 150px;
}
.error {
  color: #c0392b;
  margin-top: 10px;
}
.success {
  color: #27ae60;
  text-align: center;
  padding: 20px;
}
</style>
```

### Angular

```typescript
// paypal-checkout.component.ts
import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

declare var paypal: any;

@Component({
  selector: 'app-paypal-checkout',
  template: `
    <div class="paypal-checkout">
      <div *ngIf="loading">Chargement de PayPal...</div>
      <div #paypalContainer class="paypal-buttons"></div>
      <p *ngIf="error" class="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .paypal-buttons { min-height: 150px; }
    .error { color: #c0392b; }
  `]
})
export class PayPalCheckoutComponent implements AfterViewInit {
  @Input() amount!: number;
  @Input() currency = 'EUR';
  @Input() societeId!: string;

  @Output() success = new EventEmitter<{ orderId: string; details: any }>();
  @Output() paypalError = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('paypalContainer') paypalContainer!: ElementRef;

  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    this.loadPayPalScript().then(() => {
      this.renderButtons();
    });
  }

  private loadPayPalScript(): Promise<void> {
    if (typeof paypal !== 'undefined') {
      this.loading = false;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=${this.currency}`;
      script.onload = () => {
        this.loading = false;
        resolve();
      };
      script.onerror = () => {
        this.loading = false;
        this.error = 'Impossible de charger PayPal';
        reject();
      };
      document.body.appendChild(script);
    });
  }

  private renderButtons() {
    paypal.Buttons({
      createOrder: async () => {
        const response = await this.http.post<{ id: string }>(
          `${environment.apiUrl}/paypal/orders`,
          {
            societeId: this.societeId,
            intent: 'CAPTURE',
            purchaseUnits: [{
              amount: this.amount,
              currency: this.currency,
            }],
            returnUrl: window.location.href,
            cancelUrl: window.location.href,
          }
        ).toPromise();
        return response!.id;
      },

      onApprove: async (data: { orderID: string }) => {
        const details = await this.http.post<any>(
          `${environment.apiUrl}/paypal/orders/${data.orderID}/capture`,
          { societeId: this.societeId }
        ).toPromise();

        if (details.status === 'COMPLETED') {
          this.success.emit({ orderId: data.orderID, details });
        } else {
          this.error = `Statut: ${details.status}`;
          this.paypalError.emit(details);
        }
      },

      onCancel: () => {
        this.cancel.emit();
      },

      onError: (err: any) => {
        this.error = 'Erreur PayPal';
        this.paypalError.emit(err);
      },
    }).render(this.paypalContainer.nativeElement);
  }
}
```

---

## Tests

### Comptes de test PayPal Sandbox

1. Connectez-vous à [PayPal Developer](https://developer.paypal.com/)
2. Allez dans **Sandbox** > **Accounts**
3. Créez un compte "Personal" (acheteur test)
4. Utilisez ces credentials pour tester les paiements

### Credentials Sandbox

| Type | Email | Mot de passe |
|------|-------|--------------|
| Business (vendeur) | sb-xxx@business.example.com | (généré) |
| Personal (acheteur) | sb-xxx@personal.example.com | (généré) |

### Cartes de test (via PayPal Sandbox)

| Type | Numéro |
|------|--------|
| Visa | 4032039317984658 |
| Mastercard | 5425233430109903 |
| American Express | 374245455400001 |

### Test des webhooks en local

```bash
# Utiliser un tunnel comme ngrok
ngrok http 3000

# Configurer l'URL webhook dans PayPal Developer Dashboard:
# https://xxxx.ngrok.io/paypal/webhooks
```

---

## Checklist d'intégration

- [ ] Créer un compte PayPal Business
- [ ] Obtenir les credentials Sandbox (Client ID & Secret)
- [ ] Configurer le compte PayPal via l'API `/paypal-accounts`
- [ ] Intégrer les boutons PayPal ou le flow de redirection
- [ ] Gérer la capture des paiements
- [ ] Implémenter les pages de retour (success/cancel)
- [ ] Configurer les webhooks
- [ ] Tester avec des comptes Sandbox
- [ ] Passer en Production (credentials Live)

---

## Différences avec Stripe

| Aspect | PayPal | Stripe |
|--------|--------|--------|
| SDK Frontend | Script dynamique | npm package |
| Flow principal | Popup/Redirection | Formulaire intégré |
| Capture | Manuelle (après approbation) | Automatique |
| Multi-devise | Via order | Via intent |
| Abonnements | Plans PayPal | Prices/Subscriptions |

---

## Support

- [Documentation PayPal](https://developer.paypal.com/docs/)
- [API Reference](https://developer.paypal.com/docs/api/orders/v2/)
- [SDK JavaScript](https://developer.paypal.com/sdk/js/)
- [PayPal Sandbox](https://developer.paypal.com/tools/sandbox/)
