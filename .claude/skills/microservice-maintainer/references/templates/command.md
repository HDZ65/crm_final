# Template: Command

## Fichiers générés

| Fichier | Chemin |
|---------|--------|
| Command | `application/commands/<action>-<aggregate>.command.ts` |
| Handler | `application/commands/handlers/<action>-<aggregate>.handler.ts` |
| Proto | `packages/proto/<context>_commands.proto` (ajout RPC) |
| Controller | `infrastructure/grpc/<context>.commands.grpc-controller.ts` (ajout méthode) |
| Test | `test/<action>-<aggregate>.spec.ts` |

---

## 1. Command

```typescript
// application/commands/<action>-<aggregate>.command.ts

export class <Action><Aggregate>Command {
  constructor(
    public readonly userId: string,
    // <fields>
  ) {}
}
```

### Exemple : CreateInvoiceCommand

```typescript
export class CreateInvoiceCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly amountCents: number,
  ) {}
}
```

---

## 2. Handler

```typescript
// application/commands/handlers/<action>-<aggregate>.handler.ts

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { <Action><Aggregate>Command } from '../<action>-<aggregate>.command';
import { <Aggregate> } from '../../../domain/entities/<aggregate>.aggregate';
import { <Aggregate>Repository } from '../../../domain/repositories/<aggregate>.repository';

@CommandHandler(<Action><Aggregate>Command)
export class <Action><Aggregate>Handler implements ICommandHandler<<Action><Aggregate>Command> {
  constructor(
    @Inject('<AGGREGATE>_REPOSITORY')
    private readonly repository: <Aggregate>Repository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: <Action><Aggregate>Command): Promise<string> {
    // 1. Créer/charger l'aggregate
    const <aggregate> = <Aggregate>.create(
      command.userId,
      // command.<fields>
    );

    // 2. Persister
    await this.repository.save(<aggregate>);

    // 3. Publier domain events
    <aggregate>.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    <aggregate>.commit();

    return <aggregate>.getId();
  }
}
```

### Exemple : CreateInvoiceHandler

```typescript
@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    @Inject('INVOICE_REPOSITORY')
    private readonly repository: InvoiceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateInvoiceCommand): Promise<string> {
    const invoice = Invoice.create(
      command.userId,
      command.name,
      command.amountCents,
    );

    await this.repository.save(invoice);

    invoice.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });
    invoice.commit();

    return invoice.getId();
  }
}
```

---

## 3. Proto (ajout)

```protobuf
// packages/proto/<context>_commands.proto

// Ajouter dans le service existant
service <Context>CommandsService {
  // ... existing RPCs
  rpc <Action><Aggregate>(<Action><Aggregate>Request) returns (<Action><Aggregate>Response);
}

// Ajouter les messages
message <Action><Aggregate>Request {
  string user_id = 1;
  // <fields>
}

message <Action><Aggregate>Response {
  bool success = 1;
  string id = 2;
}
```

### Exemple : CreateInvoice

```protobuf
service BillingCommandsService {
  rpc CreateInvoice(CreateInvoiceRequest) returns (CreateInvoiceResponse);
}

message CreateInvoiceRequest {
  string user_id = 1;
  string name = 2;
  optional int64 amount_cents = 3;
}

message CreateInvoiceResponse {
  bool success = 1;
  string id = 2;
}
```

---

## 4. Controller (ajout méthode)

```typescript
// infrastructure/grpc/<context>.commands.grpc-controller.ts

// Ajouter la méthode dans le controller existant
async <action><Aggregate>(request: <Action><Aggregate>Request): Promise<<Action><Aggregate>Response> {
  const command = new <Action><Aggregate>Command(
    request.userId,
    // request.<fields>
  );

  const id = await this.commandBus.execute<<Action><Aggregate>Command, string>(command);

  return {
    success: true,
    id,
  };
}
```

### Exemple : createInvoice

```typescript
async createInvoice(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  const command = new CreateInvoiceCommand(
    request.userId,
    request.name,
    request.amountCents ?? 0,
  );

  const invoiceId = await this.commandBus.execute<CreateInvoiceCommand, string>(command);

  return {
    success: true,
    id: invoiceId,
  };
}
```

---

## 5. Test

```typescript
// test/<action>-<aggregate>.spec.ts

import { Test } from '@nestjs/testing';
import { <Action><Aggregate>Handler } from '../src/<context>/application/commands/handlers/<action>-<aggregate>.handler';
import { <Action><Aggregate>Command } from '../src/<context>/application/commands/<action>-<aggregate>.command';

describe('<Action><Aggregate>Handler', () => {
  let handler: <Action><Aggregate>Handler;
  let mockRepository: jest.Mocked<<Aggregate>Repository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        <Action><Aggregate>Handler,
        { provide: '<AGGREGATE>_REPOSITORY', useValue: mockRepository },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    handler = module.get(<Action><Aggregate>Handler);
  });

  it('should create <aggregate> and return id', async () => {
    const command = new <Action><Aggregate>Command(
      'user-123',
      // <fields>
    );

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalled();
  });
});
```

---

## 6. Module (enregistrement)

```typescript
// <context>.module.ts

// Ajouter dans providers
providers: [
  // ... existing handlers
  <Action><Aggregate>Handler,
],
```

---

## Checklist

- [ ] Command créée avec tous les champs
- [ ] Handler implémenté avec repository + eventBus
- [ ] Proto mis à jour (RPC + messages)
- [ ] `buf generate` exécuté
- [ ] Controller mis à jour
- [ ] Handler enregistré dans le module
- [ ] Test créé
- [ ] `npm run build && npm run test` passent
