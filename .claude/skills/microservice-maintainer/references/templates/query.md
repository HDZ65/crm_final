# Template: Query

## Fichiers générés

| Fichier | Chemin |
|---------|--------|
| Query | `application/queries/<action>-<aggregate>.query.ts` |
| Handler | `application/queries/handlers/<action>-<aggregate>.handler.ts` |
| DTO | `application/dto/<aggregate>.dto.ts` (si nouveau) |
| Proto | `packages/proto/<context>_queries.proto` (ajout RPC) |
| Controller | `infrastructure/grpc/<context>.queries.grpc-controller.ts` (ajout méthode) |
| Test | `test/<action>-<aggregate>.spec.ts` |

---

## 1. Query

```typescript
// application/queries/<action>-<aggregate>.query.ts

export class <Action><Aggregate>Query {
  constructor(
    public readonly id: string,
    // <filters>
  ) {}
}
```

### Variantes

```typescript
// Get by ID
export class GetInvoiceQuery {
  constructor(public readonly id: string) {}
}

// List avec pagination
export class ListInvoicesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly filters?: {
      status?: string;
      fromDate?: Date;
    },
  ) {}
}

// Search
export class SearchInvoicesQuery {
  constructor(
    public readonly userId: string,
    public readonly searchTerm: string,
  ) {}
}
```

---

## 2. Handler

```typescript
// application/queries/handlers/<action>-<aggregate>.handler.ts

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { <Action><Aggregate>Query } from '../<action>-<aggregate>.query';
import { <Aggregate>Dto } from '../../dto/<aggregate>.dto';
import { <Aggregate>Repository } from '../../../domain/repositories/<aggregate>.repository';

@QueryHandler(<Action><Aggregate>Query)
export class <Action><Aggregate>Handler implements IQueryHandler<<Action><Aggregate>Query> {
  constructor(
    @Inject('<AGGREGATE>_REPOSITORY')
    private readonly repository: <Aggregate>Repository,
  ) {}

  async execute(query: <Action><Aggregate>Query): Promise<<Aggregate>Dto | null> {
    const <aggregate> = await this.repository.findById(query.id);

    if (!<aggregate>) {
      return null;
    }

    return <Aggregate>Dto.fromDomain(<aggregate>);
  }
}
```

### Exemple : ListInvoicesHandler

```typescript
@QueryHandler(ListInvoicesQuery)
export class ListInvoicesHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(
    @Inject('INVOICE_REPOSITORY')
    private readonly repository: InvoiceRepository,
  ) {}

  async execute(query: ListInvoicesQuery): Promise<PaginatedResult<InvoiceDto>> {
    const { items, total } = await this.repository.findByUserId(query.userId, {
      page: query.page,
      limit: query.limit,
      filters: query.filters,
    });

    return {
      items: items.map(invoice => InvoiceDto.fromDomain(invoice)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
}
```

---

## 3. DTO

```typescript
// application/dto/<aggregate>.dto.ts

export class <Aggregate>Dto {
  id: string;
  userId: string;
  // <fields>
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(<aggregate>: <Aggregate>): <Aggregate>Dto {
    const dto = new <Aggregate>Dto();
    dto.id = <aggregate>.getId();
    dto.userId = <aggregate>.getUserId();
    // dto.<field> = <aggregate>.get<Field>();
    dto.createdAt = <aggregate>.getCreatedAt();
    dto.updatedAt = <aggregate>.getUpdatedAt();
    return dto;
  }
}
```

### Exemple : InvoiceDto

```typescript
export class InvoiceDto {
  id: string;
  userId: string;
  name: string;
  status: string;
  amountCents: number;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(invoice: Invoice): InvoiceDto {
    const dto = new InvoiceDto();
    dto.id = invoice.getId();
    dto.userId = invoice.getUserId();
    dto.name = invoice.getName();
    dto.status = invoice.getStatus().toString();
    dto.amountCents = invoice.getAmount();
    dto.createdAt = invoice.getCreatedAt();
    dto.updatedAt = invoice.getUpdatedAt();
    return dto;
  }
}
```

---

## 4. Proto (ajout)

```protobuf
// packages/proto/<context>_queries.proto

service <Context>QueriesService {
  // ... existing RPCs
  rpc <Action><Aggregate>(<Action><Aggregate>Request) returns (<Action><Aggregate>Response);
}

message <Action><Aggregate>Request {
  string id = 1;
  // <filters>
}

message <Action><Aggregate>Response {
  <Aggregate>Dto <aggregate> = 1;  // ou repeated pour list
}

message <Aggregate>Dto {
  string id = 1;
  string user_id = 2;
  // <fields>
  string created_at = 10;
  string updated_at = 11;
}
```

### Exemple : GetInvoice / ListInvoices

```protobuf
service BillingQueriesService {
  rpc GetInvoice(GetInvoiceRequest) returns (GetInvoiceResponse);
  rpc ListInvoices(ListInvoicesRequest) returns (ListInvoicesResponse);
}

message GetInvoiceRequest {
  string id = 1;
}

message GetInvoiceResponse {
  InvoiceDto invoice = 1;
}

message ListInvoicesRequest {
  string user_id = 1;
  optional int32 page = 2;
  optional int32 limit = 3;
  optional string status_filter = 4;
}

message ListInvoicesResponse {
  repeated InvoiceDto invoices = 1;
  int32 total = 2;
  int32 page = 3;
  int32 total_pages = 4;
}

message InvoiceDto {
  string id = 1;
  string user_id = 2;
  string name = 3;
  string status = 4;
  int64 amount_cents = 5;
  string created_at = 10;
  string updated_at = 11;
}
```

---

## 5. Controller (ajout méthode)

```typescript
// infrastructure/grpc/<context>.queries.grpc-controller.ts

async <action><Aggregate>(request: <Action><Aggregate>Request): Promise<<Action><Aggregate>Response> {
  const query = new <Action><Aggregate>Query(request.id);

  const result = await this.queryBus.execute<<Action><Aggregate>Query, <Aggregate>Dto | null>(query);

  if (!result) {
    throw new RpcException({ code: 5, message: '<Aggregate> not found' });
  }

  return {
    <aggregate>: this.mapper.toProto(result),
  };
}
```

### Exemple : getInvoice

```typescript
async getInvoice(request: GetInvoiceRequest): Promise<GetInvoiceResponse> {
  const query = new GetInvoiceQuery(request.id);

  const result = await this.queryBus.execute<GetInvoiceQuery, InvoiceDto | null>(query);

  if (!result) {
    throw new RpcException({ code: 5, message: 'Invoice not found' });
  }

  return {
    invoice: this.mapper.toProto(result),
  };
}
```

---

## 6. Mapper (si nouveau DTO)

```typescript
// infrastructure/grpc/<aggregate>.grpc-mapper.ts

@Injectable()
export class <Aggregate>GrpcMapper {
  toProto(dto: <Aggregate>Dto): <Aggregate>Dto {
    return {
      id: dto.id,
      userId: dto.userId,
      // <fields>
      createdAt: dto.createdAt.toISOString(),
      updatedAt: dto.updatedAt.toISOString(),
    };
  }
}
```

---

## 7. Test

```typescript
// test/<action>-<aggregate>.spec.ts

describe('<Action><Aggregate>Handler', () => {
  let handler: <Action><Aggregate>Handler;
  let mockRepository: jest.Mocked<<Aggregate>Repository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        <Action><Aggregate>Handler,
        { provide: '<AGGREGATE>_REPOSITORY', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get(<Action><Aggregate>Handler);
  });

  it('should return <aggregate> when found', async () => {
    const mock<Aggregate> = <Aggregate>.reconstitute({
      id: 'test-id',
      // <fields>
    });
    mockRepository.findById.mockResolvedValue(mock<Aggregate>);

    const query = new <Action><Aggregate>Query('test-id');
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result?.id).toBe('test-id');
  });

  it('should return null when not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const query = new <Action><Aggregate>Query('unknown-id');
    const result = await handler.execute(query);

    expect(result).toBeNull();
  });
});
```

---

## Checklist

- [ ] Query créée avec tous les paramètres
- [ ] Handler implémenté
- [ ] DTO créé/mis à jour avec fromDomain()
- [ ] Proto mis à jour (RPC + messages + DTO)
- [ ] `buf generate` exécuté
- [ ] Controller mis à jour
- [ ] Mapper mis à jour si besoin
- [ ] Handler enregistré dans le module
- [ ] Test créé
- [ ] `npm run build && npm run test` passent
