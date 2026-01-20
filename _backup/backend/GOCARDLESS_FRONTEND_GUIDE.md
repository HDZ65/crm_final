# GoCardless - Guide d'intégration Frontend

Ce guide explique comment intégrer les paiements par prélèvement bancaire (SEPA/Direct Debit) via GoCardless dans votre application frontend.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Flow utilisateur](#flow-utilisateur)
3. [Configuration](#configuration)
4. [Intégration pas à pas](#intégration-pas-à-pas)
5. [Exemples de code](#exemples-de-code)
6. [Gestion des états](#gestion-des-états)
7. [Webhooks et callbacks](#webhooks-et-callbacks)
8. [FAQ et troubleshooting](#faq-et-troubleshooting)

---

## Vue d'ensemble

GoCardless permet de collecter des paiements par prélèvement bancaire (SEPA en Europe, BACS au Royaume-Uni). Contrairement aux paiements par carte, le prélèvement bancaire nécessite :

1. **Un mandat** : Autorisation du client pour prélever sur son compte
2. **Des paiements** : Prélèvements ponctuels ou récurrents

### Avantages du prélèvement bancaire

- Taux d'échec très faibles (pas d'expiration de carte)
- Frais réduits par rapport aux cartes bancaires
- Idéal pour les abonnements et paiements récurrents
- Pas besoin de renouveler les informations de paiement

### Délais de traitement

| Étape | Délai |
|-------|-------|
| Création du mandat | Instantané |
| Activation du mandat | 3-5 jours ouvrés |
| Prélèvement d'un paiement | 3-5 jours ouvrés |
| Fonds sur votre compte | +2 jours après confirmation |

---

## Flow utilisateur

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SETUP DU MANDAT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Utilisateur clique "Configurer le prélèvement"                 │
│                           │                                         │
│                           ▼                                         │
│  2. Frontend appelle POST /gocardless/setup-mandate                │
│                           │                                         │
│                           ▼                                         │
│  3. Backend retourne { authorisationUrl }                          │
│                           │                                         │
│                           ▼                                         │
│  4. Frontend redirige vers GoCardless (page hébergée)              │
│                           │                                         │
│                           ▼                                         │
│  5. Client saisit ses coordonnées bancaires (IBAN)                 │
│                           │                                         │
│                           ▼                                         │
│  6. GoCardless redirige vers votre redirectUri                     │
│                           │                                         │
│                           ▼                                         │
│  7. Frontend affiche confirmation + attend activation              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    PRÉLÈVEMENT DE PAIEMENTS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Mandat actif ? ──► POST /gocardless/payments ──► Paiement créé    │
│                                                                     │
│  Ou pour abonnement :                                               │
│                                                                     │
│  Mandat actif ? ──► POST /gocardless/subscriptions ──► Récurrent   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Variables d'environnement Frontend

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3000

# URLs de redirection après setup du mandat
VITE_GOCARDLESS_SUCCESS_URL=http://localhost:5173/payment/success
VITE_GOCARDLESS_CANCEL_URL=http://localhost:5173/payment/cancel
```

### URLs de redirection

Configurez deux pages dans votre application :

| Page | URL | Description |
|------|-----|-------------|
| Succès | `/payment/success` | Après validation du mandat |
| Annulation | `/payment/cancel` | Si l'utilisateur quitte le flow |

---

## Intégration pas à pas

### Étape 1 : Setup du mandat

Le setup du mandat est la première étape obligatoire. Il permet au client d'autoriser les prélèvements sur son compte bancaire.

```typescript
// services/gocardless.service.ts

const API_URL = import.meta.env.VITE_API_URL;

export interface SetupMandateRequest {
  clientId: string;
  redirectUri: string;
  exitUri: string;
  currency?: string;  // 'EUR' par défaut
  scheme?: string;    // 'sepa_core' par défaut
}

export interface SetupMandateResponse {
  billingRequestId: string;
  authorisationUrl: string;
}

export async function setupMandate(
  request: SetupMandateRequest
): Promise<SetupMandateResponse> {
  const response = await fetch(`${API_URL}/gocardless/setup-mandate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`, // Si authentification requise
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la création du mandat');
  }

  return response.json();
}
```

### Étape 2 : Redirection vers GoCardless

```typescript
// components/SetupDirectDebit.tsx (React)

import { useState } from 'react';
import { setupMandate } from '../services/gocardless.service';

interface Props {
  clientId: string;
}

export function SetupDirectDebit({ clientId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await setupMandate({
        clientId,
        redirectUri: `${window.location.origin}/payment/success?clientId=${clientId}`,
        exitUri: `${window.location.origin}/payment/cancel`,
        currency: 'EUR',
      });

      // Stocker le billingRequestId pour vérification ultérieure
      localStorage.setItem('gc_billing_request', result.billingRequestId);

      // Rediriger vers GoCardless
      window.location.href = result.authorisationUrl;
    } catch (err) {
      setError('Impossible de configurer le prélèvement. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="setup-direct-debit">
      <h3>Configurer le prélèvement automatique</h3>
      <p>
        Autorisez les prélèvements sur votre compte bancaire pour faciliter vos paiements.
      </p>

      {error && <div className="error">{error}</div>}

      <button onClick={handleSetup} disabled={loading}>
        {loading ? 'Chargement...' : 'Configurer le prélèvement'}
      </button>

      <small>
        Vous serez redirigé vers une page sécurisée GoCardless pour saisir vos coordonnées bancaires.
      </small>
    </div>
  );
}
```

### Étape 3 : Page de succès

```typescript
// pages/PaymentSuccess.tsx

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const clientId = searchParams.get('clientId');

  useEffect(() => {
    // Le webhook backend a déjà créé le mandat en BDD
    // On peut simplement afficher une confirmation

    // Optionnel : vérifier le statut du mandat
    const checkMandateStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/gocardless/mandates/client/${clientId}/active`
        );

        if (response.ok) {
          const mandate = await response.json();
          if (mandate) {
            setStatus('success');
          } else {
            // Le mandat est en cours de traitement
            setStatus('success'); // Afficher succès même si pas encore actif
          }
        }
      } catch (err) {
        // En cas d'erreur, afficher quand même succès
        // car le webhook s'en chargera
        setStatus('success');
      }
    };

    if (clientId) {
      checkMandateStatus();
    } else {
      setStatus('success');
    }

    // Nettoyer le localStorage
    localStorage.removeItem('gc_billing_request');
  }, [clientId]);

  if (status === 'loading') {
    return <div>Vérification en cours...</div>;
  }

  return (
    <div className="payment-success">
      <div className="success-icon">✓</div>
      <h1>Prélèvement configuré avec succès !</h1>
      <p>
        Votre autorisation de prélèvement a été enregistrée.
        Elle sera active sous 3 à 5 jours ouvrés.
      </p>
      <p>
        Vous recevrez un email de confirmation de GoCardless avec les détails de votre mandat.
      </p>
      <button onClick={() => navigate('/dashboard')}>
        Retour au tableau de bord
      </button>
    </div>
  );
}
```

### Étape 4 : Page d'annulation

```typescript
// pages/PaymentCancel.tsx

import { useNavigate } from 'react-router-dom';

export function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('gc_billing_request');
  }, []);

  return (
    <div className="payment-cancel">
      <h1>Configuration annulée</h1>
      <p>
        Vous avez quitté la configuration du prélèvement automatique.
        Vous pouvez réessayer à tout moment.
      </p>
      <button onClick={() => navigate(-1)}>
        Retour
      </button>
    </div>
  );
}
```

---

## Exemples de code

### Vérifier si un client a un mandat actif

```typescript
export async function getActiveMandate(clientId: string) {
  const response = await fetch(
    `${API_URL}/gocardless/mandates/client/${clientId}/active`
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// Utilisation
const mandate = await getActiveMandate(clientId);
if (mandate && mandate.mandateStatus === 'active') {
  // Le client peut être prélevé
}
```

### Créer un paiement ponctuel

```typescript
export interface CreatePaymentRequest {
  amount: number;      // En centimes (2500 = 25.00 EUR)
  currency?: string;   // 'EUR' par défaut
  reference?: string;  // Référence visible sur le relevé bancaire
  description?: string;
}

export async function createPayment(
  clientId: string,
  request: CreatePaymentRequest
) {
  const response = await fetch(
    `${API_URL}/gocardless/payments/client/${clientId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors du paiement');
  }

  return response.json();
}

// Utilisation
const payment = await createPayment('client-uuid', {
  amount: 2500,  // 25.00 EUR
  reference: 'FACTURE-2024-001',
  description: 'Paiement facture janvier',
});

console.log('Paiement créé:', payment.id);
console.log('Date de prélèvement:', payment.chargeDate);
```

### Créer un abonnement récurrent

```typescript
export interface CreateSubscriptionRequest {
  amount: number;
  currency?: string;
  name?: string;
  intervalUnit?: 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number;  // 1-28
}

export async function createSubscription(
  clientId: string,
  request: CreateSubscriptionRequest
) {
  const response = await fetch(
    `${API_URL}/gocardless/subscriptions/client/${clientId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la création de l\'abonnement');
  }

  return response.json();
}

// Utilisation
const subscription = await createSubscription('client-uuid', {
  amount: 4990,         // 49.90 EUR
  name: 'Abonnement Premium',
  intervalUnit: 'monthly',
  dayOfMonth: 1,        // Prélèvement le 1er de chaque mois
});

console.log('Abonnement créé:', subscription.id);
console.log('Prochains paiements:', subscription.upcomingPayments);
```

### Annuler un abonnement

```typescript
export async function cancelSubscription(subscriptionId: string) {
  const response = await fetch(
    `${API_URL}/gocardless/subscriptions/${subscriptionId}/cancel`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error('Erreur lors de l\'annulation');
  }

  return response.json();
}
```

### Lister les mandats d'un client

```typescript
export async function getMandates(clientId: string) {
  const response = await fetch(
    `${API_URL}/gocardless/mandates?clientId=${clientId}`
  );

  return response.json();
}
```

---

## Gestion des états

### États du mandat

| État | Description | Action UI |
|------|-------------|-----------|
| `pending_customer_approval` | En attente de validation client | "En cours de configuration" |
| `pending_submission` | En attente d'envoi à la banque | "En cours de traitement" |
| `submitted` | Envoyé à la banque | "En cours de validation" |
| `active` | Actif, peut être prélevé | "Actif" ✓ |
| `cancelled` | Annulé | "Annulé" |
| `failed` | Échec | "Échec - Reconfigurer" |
| `expired` | Expiré | "Expiré - Reconfigurer" |

### Composant de statut

```typescript
// components/MandateStatus.tsx

interface Props {
  status: string;
  onReconfigure?: () => void;
}

export function MandateStatus({ status, onReconfigure }: Props) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Prélèvement actif',
          color: 'green',
          icon: '✓',
        };
      case 'pending_customer_approval':
      case 'pending_submission':
      case 'submitted':
        return {
          label: 'En cours de validation',
          color: 'orange',
          icon: '⏳',
        };
      case 'cancelled':
        return {
          label: 'Prélèvement annulé',
          color: 'gray',
          icon: '✕',
          showReconfigure: true,
        };
      case 'failed':
      case 'expired':
        return {
          label: 'Prélèvement expiré',
          color: 'red',
          icon: '⚠',
          showReconfigure: true,
        };
      default:
        return {
          label: 'Non configuré',
          color: 'gray',
          icon: '○',
          showReconfigure: true,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`mandate-status mandate-status--${config.color}`}>
      <span className="icon">{config.icon}</span>
      <span className="label">{config.label}</span>
      {config.showReconfigure && onReconfigure && (
        <button onClick={onReconfigure}>
          Configurer le prélèvement
        </button>
      )}
    </div>
  );
}
```

### États du paiement

| État | Description |
|------|-------------|
| `pending_submission` | En attente d'envoi |
| `submitted` | Envoyé à la banque |
| `confirmed` | Confirmé (fonds sécurisés) |
| `paid_out` | Versé sur votre compte |
| `cancelled` | Annulé |
| `failed` | Échec |
| `charged_back` | Remboursé par la banque |

---

## Webhooks et callbacks

### Écouter les changements de statut (optionnel)

Si vous utilisez des WebSockets ou du polling, vous pouvez surveiller les changements :

```typescript
// hooks/useMandateStatus.ts

import { useState, useEffect } from 'react';

export function useMandateStatus(clientId: string) {
  const [mandate, setMandate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/gocardless/mandates/client/${clientId}/active`
        );
        if (response.ok) {
          setMandate(await response.json());
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch initial
    fetchStatus();

    // Polling toutes les 30 secondes (optionnel)
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [clientId]);

  return { mandate, loading };
}
```

### Notifications utilisateur

Le backend traite automatiquement les webhooks GoCardless. Vous pouvez afficher des notifications basées sur le statut :

```typescript
// components/PaymentNotifications.tsx

export function PaymentNotifications({ clientId }) {
  const { mandate } = useMandateStatus(clientId);

  useEffect(() => {
    if (mandate?.mandateStatus === 'active') {
      toast.success('Votre prélèvement est maintenant actif !');
    } else if (mandate?.mandateStatus === 'failed') {
      toast.error('Échec de la configuration du prélèvement. Veuillez réessayer.');
    }
  }, [mandate?.mandateStatus]);

  return null;
}
```

---

## FAQ et troubleshooting

### Le mandat reste en "pending" longtemps

**Cause** : Les mandats SEPA peuvent prendre 3-5 jours ouvrés pour être activés.

**Solution** : Informez l'utilisateur que c'est normal et que le mandat sera actif sous quelques jours.

### Erreur "Mandate not active" lors d'un paiement

**Cause** : Le mandat n'est pas encore actif ou a été annulé.

**Solution** :
```typescript
const mandate = await getActiveMandate(clientId);
if (!mandate || mandate.mandateStatus !== 'active') {
  // Afficher message d'erreur ou proposer de reconfigurer
  showError('Votre mandat de prélèvement n\'est pas actif.');
}
```

### L'utilisateur quitte la page GoCardless

**Cause** : L'utilisateur ferme l'onglet ou clique sur "Annuler".

**Solution** : Il sera redirigé vers `exitUri`. Proposez-lui de réessayer.

### Comment tester en sandbox ?

1. Utilisez les credentials sandbox dans le `.env` backend
2. GoCardless fournit des IBAN de test :
   - `GB82WEST12345698765432` - Succès
   - `GB05WEST12345600000000` - Échec
3. En sandbox, les mandats s'activent instantanément

### Puis-je personnaliser la page GoCardless ?

Non, la page de checkout est hébergée par GoCardless pour des raisons de sécurité et conformité PCI. Vous pouvez cependant :
- Ajouter votre logo (dans le dashboard GoCardless)
- Personnaliser les couleurs (plan payant)
- Pré-remplir les informations client

---

## Checklist d'intégration

- [ ] Configurer les variables d'environnement
- [ ] Créer la page `/payment/success`
- [ ] Créer la page `/payment/cancel`
- [ ] Implémenter le composant `SetupDirectDebit`
- [ ] Afficher le statut du mandat dans le profil client
- [ ] Gérer les erreurs de paiement
- [ ] Tester le flow complet en sandbox
- [ ] Configurer les notifications email (optionnel)

---

## Support

- **Documentation GoCardless** : https://developer.gocardless.com
- **Dashboard GoCardless** : https://manage.gocardless.com
- **Statuts API** : https://status.gocardless.com
