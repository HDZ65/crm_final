# Template: Event

## Types d'events

| Type | Usage |
|------|-------|
| Domain Event | Interne au bounded context, déclenche side effects |
| Integration Event | Publié via NATS, consommé par d'autres services |

---

## Fichiers générés

| Fichier | Chemin |
|---------|--------|
| Domain Event | `domain/events/<aggregate>-<action>.event.ts` |
| Event Handler (interne) | `application/events/<aggregate>-<action>.handler.ts` |
| NATS Publisher | Dans le handler existant (ajout publish) |
| NATS Listener | `infrastructure/nats/<topic>.listener.ts` |
| Event Catalog | `docs/catalogs/event_catalog.yaml` (mise à jour) |

---

## 1. Domain Event

```typescript
// domain/events/<aggregate>-<action>.event.ts

export class <Aggregate><Action>Event {
  constructor(
    public readonly aggregateId: string,
    // <payload fields>
    public readonly occurredAt: Date = new Date(),
  ) {}

  static create(aggregateId: string, /* <fields> */): <Aggregate><Action>Event {
    return new <Aggregate><Action>Event(aggregateId, /* <fields> */);
  }
}
```

### Exemple : InvoiceCreatedEvent

```typescript
export class InvoiceCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly name: string,
    public readonly amountCents: number,
    public readonly occurredAt: Date = new Date(),
  ) {}

  static create(
    aggregateId: string,
    userId: string,
    name: string,
    amountCents: number,
  ): InvoiceCreatedEvent {
    return new InvoiceCreatedEvent(aggregateId, userId, name, amountCents);
  }
}
```

---

## 2. Aggregate (émettre l'event)

```typescript
// domain/entities/<aggregate>.aggregate.ts

// Dans la factory method ou business method
static create(userId: string, name: string, amount: number): Invoice {
  const invoice = new Invoice();
  // ... set properties

  // Émettre le domain event
  invoice.apply(InvoiceCreatedEvent.create(
    invoice.id,
    userId,
    name,
    amount,
  ));

  return invoice;
}
```

---

## 3. Event Handler interne (CQRS)

```typescript
// application/events/<aggregate>-<action>.handler.ts

import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { <Aggregate><Action>Event } from '../../domain/events/<aggregate>-<action>.event';

@EventsHandler(<Aggregate><Action>Event)
export class <Aggregate><Action>Handler implements IEventHandler<<Aggregate><Action>Event> {
  constructor(
    private readonly natsPublisher: NatsPublisher,
    // autres dépendances si side effects internes
  ) {}

  async handle(event: <Aggregate><Action>Event): Promise<void> {
    // 1. Side effects internes (optionnel)
    // await this.someService.doSomething(event);

    // 2. Publier sur NATS (integration event)
    await this.natsPublisher.publish('<context>.<aggregate>.<action>', {
      id: generateEventId(),
      type: '<context>.<aggregate>.<action>',
      timestamp: event.occurredAt.toISOString(),
      aggregateId: event.aggregateId,
      aggregateType: '<Aggregate>',
      data: {
        // <payload>
      },
    });
  }
}
```

### Exemple : InvoiceCreatedHandler

```typescript
@EventsHandler(InvoiceCreatedEvent)
export class InvoiceCreatedHandler implements IEventHandler<InvoiceCreatedEvent> {
  constructor(private readonly natsPublisher: NatsPublisher) {}

  async handle(event: InvoiceCreatedEvent): Promise<void> {
    await this.natsPublisher.publish('billing.invoice.created', {
      id: `evt_${uuid()}`,
      type: 'billing.invoice.created',
      timestamp: event.occurredAt.toISOString(),
      aggregateId: event.aggregateId,
      aggregateType: 'Invoice',
      data: {
        userId: event.userId,
        name: event.name,
        amountCents: event.amountCents,
      },
    });
  }
}
```

---

## 4. NATS Listener (consumer)

```typescript
// infrastructure/nats/<topic>.listener.ts

import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';

interface <Event>Payload {
  id: string;
  type: string;
  timestamp: string;
  aggregateId: string;
  data: {
    // <fields>
  };
}

@Controller()
export class <Topic>Listener {
  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern('<context>.<aggregate>.<action>')
  async handle<Action>(@Payload() event: <Event>Payload): Promise<void> {
    const { aggregateId, data } = event;

    // Tolerant reader : fallbacks pour nouveaux champs
    const field = data.field ?? 'default';

    await this.commandBus.execute(
      new SomeReactiveCommand(aggregateId, field),
    );
  }
}
```

### Exemple : PaymentEventsListener

```typescript
@Controller()
export class PaymentEventsListener {
  constructor(private readonly commandBus: CommandBus) {}

  @EventPattern('payments.payment.received')
  async handlePaymentReceived(@Payload() event: PaymentReceivedEvent): Promise<void> {
    const invoiceId = event.data?.invoiceId;
    if (!invoiceId) {
      // Tolerant reader : ignorer si champ manquant
      return;
    }

    await this.commandBus.execute(new MarkInvoicePaidCommand(invoiceId));
  }
}
```

---

## 5. Event Catalog (mise à jour)

```yaml
# docs/catalogs/event_catalog.yaml

events:
  - name: <context>.<aggregate>.<action>
    description: "<Description de l'event>"
    producer: <service-name>
    consumers:
      - <consumer-service-1>
      - <consumer-service-2>
    schema: |
      {
        "id": "string (uuid)",
        "type": "<context>.<aggregate>.<action>",
        "timestamp": "string (ISO 8601)",
        "aggregateId": "string",
        "aggregateType": "<Aggregate>",
        "data": {
          // <schema des champs>
        }
      }
```

### Exemple

```yaml
events:
  - name: billing.invoice.created
    description: "Émis quand une nouvelle facture est créée"
    producer: billing-service
    consumers:
      - tracking-service
      - analytics-service
    schema: |
      {
        "id": "string (uuid)",
        "type": "billing.invoice.created",
        "timestamp": "string (ISO 8601)",
        "aggregateId": "string (invoice id)",
        "aggregateType": "Invoice",
        "data": {
          "userId": "string",
          "name": "string",
          "amountCents": "number (optional)"
        }
      }
```

---

## 6. Module (enregistrement)

```typescript
// <context>.module.ts

controllers: [
  // ... existing controllers
  <Topic>Listener,  // Si consumer
],

providers: [
  // ... existing providers
  <Aggregate><Action>Handler,  // Event handler CQRS
],
```

---

## Conventions NATS

### Format topic

```
<bounded-context>.<aggregate>.<action>
```

- Tout en **lowercase**
- Séparé par des **points**
- Action au **past tense** (created, updated, deleted, paid, etc.)

### Exemples

```
billing.invoice.created
billing.invoice.paid
payments.payment.received
contacts.contact.merged
campaigns.campaign.scheduled
```

### Structure event standard

```typescript
interface DomainEvent<T> {
  id: string;              // UUID unique
  type: string;            // billing.invoice.created
  timestamp: string;       // ISO 8601
  correlationId?: string;  // Pour tracing
  causationId?: string;    // ID event parent
  aggregateId: string;     // ID de l'aggregate
  aggregateType: string;   // Invoice
  version?: number;        // Version aggregate
  data: T;                 // Payload spécifique
}
```

---

## Checklist

- [ ] Domain Event créé dans domain/events/
- [ ] Aggregate émet l'event via apply()
- [ ] Event Handler CQRS créé (si side effects)
- [ ] NATS Publisher appelé dans le handler
- [ ] NATS Listener créé (si consumer)
- [ ] Event Catalog mis à jour
- [ ] Handler/Listener enregistrés dans le module
- [ ] Consumers existants identifiés (tolerant readers)
- [ ] `npm run build && npm run test` passent
