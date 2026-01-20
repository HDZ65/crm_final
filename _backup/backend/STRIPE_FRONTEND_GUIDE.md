# Guide d'intégration Stripe - Frontend

Ce guide explique comment intégrer Stripe dans votre application frontend (React, Vue, Angular, etc.) avec le backend CRM.

## Table des matières

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Scénarios d'intégration](#scénarios-dintégration)
   - [Paiement unique (Checkout)](#1-paiement-unique-avec-stripe-checkout)
   - [Paiement custom (Elements)](#2-paiement-custom-avec-stripe-elements)
   - [Abonnements](#3-abonnements)
4. [Endpoints API disponibles](#endpoints-api-disponibles)
5. [Gestion des erreurs](#gestion-des-erreurs)
6. [Exemples complets](#exemples-complets)
7. [Tests](#tests)

---

## Installation

### React
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Vue.js
```bash
npm install @stripe/stripe-js
```

### Angular
```bash
npm install @stripe/stripe-js
```

---

## Configuration

### Variables d'environnement frontend

```env
# .env ou .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
VITE_API_URL=http://localhost:3000
```

### Initialisation de Stripe

```typescript
// lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);
```

---

## Scénarios d'intégration

### 1. Paiement unique avec Stripe Checkout

Le plus simple : redirection vers une page de paiement hébergée par Stripe.

#### Flow

```
[Bouton Payer] → [Appel API Backend] → [Redirection Stripe] → [Retour success/cancel]
```

#### Exemple React

```tsx
// components/CheckoutButton.tsx
import { useState } from 'react';

interface CheckoutButtonProps {
  amount: number;        // Montant en centimes (ex: 2000 = 20.00€)
  productName?: string;
  customerEmail?: string;
}

export function CheckoutButton({ amount, productName, customerEmail }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/stripe/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'eur',
          mode: 'payment',
          customerEmail,
          successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
          metadata: {
            productName: productName || 'Achat',
          },
        }),
      });

      const { url } = await response.json();

      // Redirection vers Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Erreur checkout:', error);
      alert('Erreur lors de la création du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="btn-primary"
    >
      {loading ? 'Chargement...' : `Payer ${(amount / 100).toFixed(2)}€`}
    </button>
  );
}
```

#### Page de succès

```tsx
// pages/PaymentSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="success-page">
      <h1>Paiement réussi !</h1>
      <p>Merci pour votre achat.</p>
      <p>Référence: {sessionId}</p>
      <a href="/">Retour à l'accueil</a>
    </div>
  );
}
```

---

### 2. Paiement custom avec Stripe Elements

Pour un formulaire de paiement intégré directement dans votre site.

#### Flow

```
[Formulaire carte] → [Create PaymentIntent] → [Confirm Payment] → [Succès]
```

#### Exemple React avec Elements

```tsx
// components/PaymentForm.tsx
import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';

// Composant interne du formulaire
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });

    if (submitError) {
      setError(submitError.message || 'Une erreur est survenue');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Traitement...' : 'Payer'}
      </button>
    </form>
  );
}

// Composant wrapper avec Elements Provider
interface PaymentFormProps {
  amount: number;
  onSuccess?: () => void;
}

export function PaymentForm({ amount }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Créer le PaymentIntent au chargement
    fetch(`${import.meta.env.VITE_API_URL}/stripe/payment-intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'eur',
        metadata: { source: 'web' },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [amount]);

  if (loading) {
    return <div>Chargement du formulaire de paiement...</div>;
  }

  if (!clientSecret) {
    return <div>Erreur: impossible de charger le formulaire</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe', // ou 'night', 'flat'
          variables: {
            colorPrimary: '#0066cc',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
        locale: 'fr',
      }}
    >
      <CheckoutForm />
    </Elements>
  );
}
```

#### Utilisation

```tsx
// pages/Checkout.tsx
import { PaymentForm } from '../components/PaymentForm';

export function Checkout() {
  return (
    <div className="checkout-page">
      <h1>Finaliser votre commande</h1>

      <div className="order-summary">
        <p>Total: 29.99€</p>
      </div>

      <PaymentForm amount={2999} />
    </div>
  );
}
```

---

### 3. Abonnements

Pour les paiements récurrents (SaaS, memberships, etc.).

#### Flow

```
[Créer Customer] → [Créer Subscription] → [Confirmer Paiement] → [Actif]
```

#### Exemple complet

```tsx
// components/SubscriptionForm.tsx
import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';

interface Plan {
  id: string;
  name: string;
  priceId: string;  // ID du prix Stripe (price_xxx)
  price: number;
  interval: 'month' | 'year';
}

const PLANS: Plan[] = [
  { id: 'basic', name: 'Basic', priceId: 'price_basic_monthly', price: 9.99, interval: 'month' },
  { id: 'pro', name: 'Pro', priceId: 'price_pro_monthly', price: 29.99, interval: 'month' },
  { id: 'enterprise', name: 'Enterprise', priceId: 'price_enterprise_monthly', price: 99.99, interval: 'month' },
];

function SubscriptionCheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription/success`,
      },
    });

    if (error) {
      setError(error.message || 'Erreur lors du paiement');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Traitement...' : "S'abonner"}
      </button>
    </form>
  );
}

export function SubscriptionForm({ userEmail }: { userEmail: string }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Étape 1: Créer le customer et l'abonnement
  const handleSelectPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    setLoading(true);

    try {
      // 1. Créer ou récupérer le customer
      let custId = customerId;
      if (!custId) {
        const customerRes = await fetch(`${import.meta.env.VITE_API_URL}/stripe/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
        const customer = await customerRes.json();
        custId = customer.id;
        setCustomerId(custId);
      }

      // 2. Créer l'abonnement
      const subscriptionRes = await fetch(`${import.meta.env.VITE_API_URL}/stripe/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: custId,
          priceId: plan.priceId,
        }),
      });
      const subscription = await subscriptionRes.json();

      // Le clientSecret est retourné pour confirmer le paiement
      setClientSecret(subscription.clientSecret);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  // Affichage des plans
  if (!selectedPlan) {
    return (
      <div className="plans-grid">
        <h2>Choisissez votre plan</h2>
        {PLANS.map((plan) => (
          <div key={plan.id} className="plan-card">
            <h3>{plan.name}</h3>
            <p className="price">{plan.price}€/{plan.interval === 'month' ? 'mois' : 'an'}</p>
            <button onClick={() => handleSelectPlan(plan)} disabled={loading}>
              {loading ? 'Chargement...' : 'Sélectionner'}
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Affichage du formulaire de paiement
  if (!clientSecret) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="subscription-checkout">
      <h2>Abonnement {selectedPlan.name}</h2>
      <p>{selectedPlan.price}€/{selectedPlan.interval === 'month' ? 'mois' : 'an'}</p>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: 'stripe' },
          locale: 'fr',
        }}
      >
        <SubscriptionCheckoutForm onSuccess={() => alert('Abonnement activé !')} />
      </Elements>

      <button onClick={() => setSelectedPlan(null)} className="btn-secondary">
        Changer de plan
      </button>
    </div>
  );
}
```

---

## Endpoints API disponibles

### Checkout Sessions

```typescript
// POST /stripe/checkout/sessions
// Crée une session de paiement Stripe Checkout

interface CreateCheckoutSessionRequest {
  customerId?: string;        // ID client Stripe existant
  customerEmail?: string;     // Email du client (si pas de customerId)
  priceId?: string;           // ID d'un prix Stripe existant
  amount?: number;            // Montant en centimes (si pas de priceId)
  currency?: string;          // 'eur', 'usd', etc. (défaut: 'eur')
  mode: 'payment' | 'subscription' | 'setup';
  successUrl: string;         // URL de redirection après succès
  cancelUrl: string;          // URL de redirection si annulation
  metadata?: Record<string, string>;
  lineItems?: Array<{         // Pour plusieurs produits
    priceId?: string;
    quantity: number;
    amount?: number;
    currency?: string;
    name?: string;
    description?: string;
  }>;
}

interface CheckoutSessionResponse {
  id: string;                 // ID de la session
  url: string;                // URL de redirection Stripe
  paymentIntentId?: string;   // Si mode='payment'
  subscriptionId?: string;    // Si mode='subscription'
}
```

### Payment Intents

```typescript
// POST /stripe/payment-intents
// Crée un PaymentIntent pour paiement custom avec Elements

interface CreatePaymentIntentRequest {
  amount: number;             // Montant en centimes
  currency: string;           // 'eur', 'usd', etc.
  customerId?: string;        // ID client Stripe
  description?: string;
  receiptEmail?: string;
  metadata?: Record<string, string>;
  automaticPaymentMethods?: boolean;  // défaut: true
}

interface PaymentIntentResponse {
  id: string;
  clientSecret: string;       // À passer à Stripe.js
  amount: number;
  currency: string;
  status: string;
}

// GET /stripe/payment-intents/:id
// Récupère un PaymentIntent

// POST /stripe/payment-intents/:id/cancel
// Annule un PaymentIntent
```

### Customers

```typescript
// POST /stripe/customers
// Crée un client Stripe

interface CreateCustomerRequest {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;         // Code ISO 2 lettres ('FR', 'BE', etc.)
  };
}

interface CustomerResponse {
  id: string;                 // cus_xxx
  email: string;
  name?: string;
  defaultPaymentMethod?: string;
}

// GET /stripe/customers/:id
// Récupère un client
```

### Subscriptions

```typescript
// POST /stripe/subscriptions
// Crée un abonnement

interface CreateSubscriptionRequest {
  customerId: string;         // cus_xxx
  priceId: string;            // price_xxx
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
  paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'allow_incomplete';
}

interface SubscriptionResponse {
  id: string;                 // sub_xxx
  status: string;             // 'active', 'incomplete', 'past_due', etc.
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  clientSecret?: string;      // Pour confirmer le premier paiement
  cancelAtPeriodEnd?: boolean;
}

// GET /stripe/subscriptions/:id
// Récupère un abonnement

// DELETE /stripe/subscriptions/:id
// Annule un abonnement (à la fin de la période en cours)
```

### Refunds

```typescript
// POST /stripe/refunds
// Crée un remboursement

interface CreateRefundRequest {
  paymentIntentId: string;    // pi_xxx
  amount?: number;            // Remboursement partiel (en centimes)
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

interface RefundResponse {
  id: string;
  amount: number;
  status: string;
  paymentIntentId: string;
}
```

---

## Gestion des erreurs

### Codes d'erreur Stripe courants

```typescript
// Erreurs de carte
const CARD_ERRORS: Record<string, string> = {
  'card_declined': 'Votre carte a été refusée',
  'expired_card': 'Votre carte a expiré',
  'incorrect_cvc': 'Le code CVC est incorrect',
  'insufficient_funds': 'Fonds insuffisants',
  'invalid_card_number': 'Numéro de carte invalide',
  'processing_error': 'Erreur de traitement, veuillez réessayer',
};

// Composant de gestion d'erreur
function PaymentError({ error }: { error: any }) {
  const getMessage = () => {
    if (error.type === 'card_error') {
      return CARD_ERRORS[error.code] || error.message;
    }
    if (error.type === 'validation_error') {
      return 'Veuillez vérifier les informations saisies';
    }
    return 'Une erreur est survenue. Veuillez réessayer.';
  };

  return (
    <div className="payment-error">
      <p>{getMessage()}</p>
    </div>
  );
}
```

### Gestion des états de paiement

```typescript
// Hook personnalisé pour gérer l'état du paiement
function usePaymentStatus(paymentIntentId: string) {
  const [status, setStatus] = useState<string>('unknown');

  useEffect(() => {
    if (!paymentIntentId) return;

    const checkStatus = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/stripe/payment-intents/${paymentIntentId}`
      );
      const data = await res.json();
      setStatus(data.status);
    };

    checkStatus();
  }, [paymentIntentId]);

  return {
    status,
    isPending: status === 'requires_payment_method' || status === 'requires_confirmation',
    isProcessing: status === 'processing',
    isSucceeded: status === 'succeeded',
    isFailed: status === 'canceled' || status === 'requires_payment_method',
  };
}
```

---

## Exemples complets

### Vue.js 3 (Composition API)

```vue
<!-- components/StripeCheckout.vue -->
<template>
  <div class="checkout">
    <div v-if="!clientSecret" class="loading">
      Chargement...
    </div>

    <div v-else ref="paymentElement" class="payment-element"></div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <button
      @click="handleSubmit"
      :disabled="loading || !stripe"
      class="pay-button"
    >
      {{ loading ? 'Traitement...' : `Payer ${formatAmount(amount)}` }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

const props = defineProps<{
  amount: number;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'error', error: string): void;
}>();

const stripe = ref<Stripe | null>(null);
const elements = ref<StripeElements | null>(null);
const clientSecret = ref<string | null>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const paymentElement = ref<HTMLElement | null>(null);

const formatAmount = (cents: number) => `${(cents / 100).toFixed(2)}€`;

onMounted(async () => {
  // Charger Stripe
  stripe.value = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  // Créer le PaymentIntent
  const res = await fetch(`${import.meta.env.VITE_API_URL}/stripe/payment-intents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: props.amount,
      currency: 'eur',
    }),
  });

  const data = await res.json();
  clientSecret.value = data.clientSecret;

  // Monter le Payment Element
  if (stripe.value && clientSecret.value) {
    elements.value = stripe.value.elements({
      clientSecret: clientSecret.value,
      locale: 'fr',
    });

    const paymentEl = elements.value.create('payment');
    paymentEl.mount(paymentElement.value!);
  }
});

const handleSubmit = async () => {
  if (!stripe.value || !elements.value) return;

  loading.value = true;
  errorMessage.value = null;

  const { error } = await stripe.value.confirmPayment({
    elements: elements.value,
    confirmParams: {
      return_url: `${window.location.origin}/success`,
    },
  });

  if (error) {
    errorMessage.value = error.message || 'Erreur de paiement';
    emit('error', errorMessage.value);
  }

  loading.value = false;
};
</script>

<style scoped>
.payment-element {
  margin: 20px 0;
}
.error {
  color: #df1b41;
  margin: 10px 0;
}
.pay-button {
  width: 100%;
  padding: 12px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.pay-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

### Angular

```typescript
// stripe-checkout.component.ts
import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-stripe-checkout',
  template: `
    <div class="checkout">
      <div #paymentElement class="payment-element"></div>
      <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
      <button
        (click)="handleSubmit()"
        [disabled]="loading || !stripe"
      >
        {{ loading ? 'Traitement...' : 'Payer ' + formatAmount(amount) }}
      </button>
    </div>
  `,
})
export class StripeCheckoutComponent implements OnInit {
  @Input() amount!: number;
  @ViewChild('paymentElement') paymentElementRef!: ElementRef;

  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  loading = false;
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    this.stripe = await loadStripe(environment.stripePublishableKey);

    this.http.post<{ clientSecret: string }>(
      `${environment.apiUrl}/stripe/payment-intents`,
      { amount: this.amount, currency: 'eur' }
    ).subscribe(data => {
      if (this.stripe) {
        this.elements = this.stripe.elements({
          clientSecret: data.clientSecret,
          locale: 'fr',
        });
        const paymentElement = this.elements.create('payment');
        paymentElement.mount(this.paymentElementRef.nativeElement);
      }
    });
  }

  formatAmount(cents: number): string {
    return `${(cents / 100).toFixed(2)}€`;
  }

  async handleSubmit() {
    if (!this.stripe || !this.elements) return;

    this.loading = true;
    this.errorMessage = null;

    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      this.errorMessage = error.message || 'Erreur de paiement';
    }

    this.loading = false;
  }
}
```

---

## Tests

### Cartes de test

| Numéro | Comportement |
|--------|--------------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 3220` | Authentification 3D Secure requise |
| `4000 0000 0000 9995` | Paiement refusé (fonds insuffisants) |
| `4000 0000 0000 0002` | Paiement refusé (carte générique) |
| `4000 0025 0000 3155` | Authentification 3DS requise |

Pour toutes les cartes de test :
- **Date d'expiration** : N'importe quelle date future (ex: 12/34)
- **CVC** : N'importe quels 3 chiffres (ex: 123)
- **Code postal** : N'importe lequel (ex: 75001)

### Test des webhooks en local

```bash
# Installer Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Se connecter à Stripe
stripe login

# Écouter les webhooks et les rediriger vers votre backend local
stripe listen --forward-to localhost:3000/stripe/webhooks

# Dans un autre terminal, déclencher des événements de test
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

---

## Checklist d'intégration

- [ ] Installer `@stripe/stripe-js` (et `@stripe/react-stripe-js` pour React)
- [ ] Configurer la clé publique Stripe (`pk_test_xxx`)
- [ ] Implémenter le flux de paiement (Checkout ou Elements)
- [ ] Gérer les redirections success/cancel
- [ ] Gérer les erreurs de paiement
- [ ] Tester avec les cartes de test
- [ ] Configurer les webhooks pour la production
- [ ] Passer en mode production (clés `pk_live_xxx` et `sk_live_xxx`)

---

## Support

- [Documentation Stripe](https://stripe.com/docs)
- [Référence API Stripe](https://stripe.com/docs/api)
- [Stripe.js Reference](https://stripe.com/docs/js)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
