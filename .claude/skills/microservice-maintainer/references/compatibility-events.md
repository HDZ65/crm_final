# Compatibilité Events (NATS)

## Règle d'or
**Les consumers existants doivent ignorer les champs inconnus et continuer à fonctionner.**

---

## Patterns SAFE (autorisés)

### 1. Ajouter un champ au payload
```typescript
// AVANT
const event = {
  id: 'evt_123',
  type: 'billing.invoice.created',
  aggregateId: 'inv_456',
  data: {
    invoiceNumber: 'INV-2024-001',
    customerId: 'cust_789',
  }
};

// APRÈS - ✅ Ajout de champ
const event = {
  id: 'evt_123',
  type: 'billing.invoice.created',
  aggregateId: 'inv_456',
  data: {
    invoiceNumber: 'INV-2024-001',
    customerId: 'cust_789',
    amountCents: 15000,  // ✅ NOUVEAU - consumers tolerants l'ignorent
  }
};
```
**Règle:** Les consumers doivent être "tolerant readers" (ignorer les champs inconnus).

### 2. Créer un nouvel event
```typescript
// ✅ Nouvel event à côté de l'existant
// billing.invoice.created  (existant)
// billing.invoice.enriched (nouveau)

await this.natsPublisher.publish('billing.invoice.enriched', {
  id: generateEventId(),
  type: 'billing.invoice.enriched',
  aggregateId: invoice.id,
  data: {
    invoiceNumber: invoice.number,
    customerId: invoice.customerId,
    amountCents: invoice.amount,
    currency: invoice.currency,
  }
});
```

### 3. Versionner le topic
```typescript
// ✅ Nouveau topic versionné
const topic = 'billing.invoice.created.v2';

await this.natsPublisher.publish(topic, eventV2);
```
**Usage:** Quand le payload change significativement.

### 4. Dual publish (transition)
```typescript
// ✅ Publier les deux formats pendant la transition
async publishInvoiceCreated(invoice: Invoice): Promise<void> {
  // Format V1 (ancien)
  await this.natsPublisher.publish('billing.invoice.created', {
    id: generateEventId(),
    type: 'billing.invoice.created',
    aggregateId: invoice.id,
    data: {
      invoiceNumber: invoice.number,
      customerId: invoice.customerId,
    }
  });

  // Format V2 (nouveau) - dual publish
  await this.natsPublisher.publish('billing.invoice.created.v2', {
    id: generateEventId(),
    type: 'billing.invoice.created.v2',
    aggregateId: invoice.id,
    data: {
      invoiceNumber: invoice.number,
      customerId: invoice.customerId,
      amountCents: invoice.amount,
      currency: invoice.currency,
      issuedAt: invoice.issuedAt.toISOString(),
    }
  });
}
```

### 5. Ajouter des consumers progressivement
```typescript
// ✅ Nouveau consumer pour un topic existant
@EventPattern('billing.invoice.created')
async handleInvoiceCreated(@Payload() event: InvoiceCreatedEvent): Promise<void> {
  // Nouveau consumer - n'affecte pas les autres
  await this.analyticsService.trackInvoice(event);
}
```

---

## Patterns INTERDITS (breaking changes)

### ❌ Renommer un topic
```typescript
// AVANT
await this.natsPublisher.publish('billing.invoice.created', event);

// APRÈS - INTERDIT
await this.natsPublisher.publish('invoices.created', event);  // ❌ Topic renommé !
```
**Conséquence:** Tous les consumers existants ne reçoivent plus rien.

### ❌ Supprimer un champ requis
```typescript
// AVANT
data: { invoiceNumber: 'INV-001', customerId: 'cust_123' }

// APRÈS - INTERDIT
data: { invoiceNumber: 'INV-001' }  // ❌ customerId supprimé !
```
**Conséquence:** Les consumers qui dépendent de `customerId` crashent.

### ❌ Changer le type d'un champ
```typescript
// AVANT
data: { amount: 100 }  // number

// APRÈS - INTERDIT
data: { amount: '100.00' }  // ❌ string maintenant !
```

### ❌ Changer la sémantique
```typescript
// AVANT - amount en centimes
data: { amount: 10000 }  // = 100.00 EUR

// APRÈS - INTERDIT - amount en euros
data: { amount: 100 }  // ❌ Même champ, sens différent !
```
**Alternative:** Créer un nouveau champ `amountCents` ou `amountEuros`.

---

## Stratégies de migration

### Migration simple (ajout de champ)
```
1. Ajouter le champ dans le producer
2. Déployer producer
3. Update consumers pour lire le nouveau champ (avec fallback)
4. Déployer consumers
```

### Migration complexe (changement de structure)
```
Phase 1: Dual Publish
- Producer publie V1 + V2
- Consumers continuent sur V1

Phase 2: Migration consumers
- Chaque consumer switch vers V2
- Déploiement progressif

Phase 3: Stop V1
- Tous les consumers sur V2
- Arrêter publication V1
- Documenter deprecation
```

### Consumer tolerant (pattern)
```typescript
@EventPattern('billing.invoice.created')
async handleInvoiceCreated(@Payload() event: any): Promise<void> {
  // Tolerant reader : extraire avec fallbacks
  const invoiceNumber = event.data?.invoiceNumber ?? event.data?.number ?? 'UNKNOWN';
  const amount = event.data?.amountCents ?? event.data?.amount ?? 0;

  // Ignorer les champs inconnus - ne pas valider strictement
  await this.process({ invoiceNumber, amount });
}
```

---

## Structure d'un event (standard Winaity)

```typescript
interface DomainEvent<T> {
  // Metadata
  id: string;              // UUID unique de l'event
  type: string;            // billing.invoice.created
  timestamp: string;       // ISO 8601
  correlationId: string;   // Pour le tracing
  causationId?: string;    // ID de l'event parent

  // Payload
  aggregateId: string;     // ID de l'aggregate concerné
  aggregateType: string;   // Invoice
  version: number;         // Version de l'aggregate
  data: T;                 // Données spécifiques
}
```

### Convention de nommage topics
```
<bounded-context>.<aggregate>.<event-type>
```

Exemples :
- `billing.invoice.created`
- `billing.invoice.paid`
- `contacts.contact.merged`
- `campaigns.campaign.scheduled`

### Règles
- Tout en **lowercase**
- Séparé par des **points**
- Verbes au **past tense** (`created`, `updated`, `deleted`)
- Préférer des events **métier** aux events CRUD génériques

---

## Vérifications avant PR

### Checklist events
```bash
# 1. Vérifier pas de rename topic
git diff HEAD~1 --name-only | xargs grep -l "natsPublisher.publish" | \
  xargs git diff HEAD~1 -- | grep -E "(^\+|^\-)" | grep "publish"

# 2. Vérifier event_catalog
git diff docs/catalogs/event_catalog.yaml

# 3. Identifier les consumers
grep -r "EventPattern" services/ | grep "<topic-name>"
```

### Semantic check (manuel)
1. "Le sens de l'event change-t-il ?"
2. "Les consumers existants vont-ils mal interpréter ?"
3. "Faut-il versionner ou dual publish ?"

---

## Exemple : Ajouter amount à invoice.created

### Event avant
```typescript
const event: InvoiceCreatedEvent = {
  id: 'evt_' + uuid(),
  type: 'billing.invoice.created',
  timestamp: new Date().toISOString(),
  correlationId: context.correlationId,
  aggregateId: invoice.id,
  aggregateType: 'Invoice',
  version: 1,
  data: {
    invoiceNumber: invoice.number,
    customerId: invoice.customerId,
  }
};
```

### Event après (backward-compat)
```typescript
const event: InvoiceCreatedEvent = {
  id: 'evt_' + uuid(),
  type: 'billing.invoice.created',
  timestamp: new Date().toISOString(),
  correlationId: context.correlationId,
  aggregateId: invoice.id,
  aggregateType: 'Invoice',
  version: 1,
  data: {
    invoiceNumber: invoice.number,
    customerId: invoice.customerId,
    amountCents: invoice.amount,  // ✅ NOUVEAU - optional, ignored by old consumers
    currency: invoice.currency,   // ✅ NOUVEAU
  }
};
```

### Consumer tolerant
```typescript
@EventPattern('billing.invoice.created')
async handleInvoiceCreated(@Payload() event: InvoiceCreatedEvent): Promise<void> {
  const { aggregateId, data } = event;

  // Tolerant read avec fallback
  const amount = data.amountCents ?? 0;
  const currency = data.currency ?? 'EUR';

  await this.trackingService.recordInvoice({
    invoiceId: aggregateId,
    amount,
    currency,
  });
}
```

---

## Update event_catalog

Après modification, mettre à jour :

```yaml
# docs/catalogs/event_catalog.yaml
events:
  - name: billing.invoice.created
    producer: billing-service
    consumers:
      - tracking-service
      - analytics-service
    schema: |
      {
        "aggregateId": "string",
        "data": {
          "invoiceNumber": "string",
          "customerId": "string",
          "amountCents": "number (optional)",  # NOUVEAU
          "currency": "string (optional)"       # NOUVEAU
        }
      }
```
