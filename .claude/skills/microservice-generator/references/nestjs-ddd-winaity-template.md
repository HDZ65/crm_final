# NestJS DDD Template (Winaity-clean style)

## Structure complète

```
services/<service-name>/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── typeorm.config.ts
│   │   └── index.ts
│   └── <bounded-context>/
│       ├── <bounded-context>.module.ts
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── <aggregate>.aggregate.ts
│       │   │   └── index.ts
│       │   ├── repositories/
│       │   │   ├── <aggregate>.repository.ts  # Interface
│       │   │   └── index.ts
│       │   ├── events/
│       │   │   ├── <aggregate>-created.event.ts
│       │   │   ├── <aggregate>-updated.event.ts
│       │   │   └── index.ts
│       │   ├── services/
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── application/
│       │   ├── commands/
│       │   │   ├── create-<aggregate>.command.ts
│       │   │   ├── update-<aggregate>.command.ts
│       │   │   ├── delete-<aggregate>.command.ts
│       │   │   ├── handlers/
│       │   │   │   ├── create-<aggregate>.handler.ts
│       │   │   │   ├── update-<aggregate>.handler.ts
│       │   │   │   ├── delete-<aggregate>.handler.ts
│       │   │   │   └── index.ts
│       │   │   └── index.ts
│       │   ├── queries/
│       │   │   ├── get-<aggregate>.query.ts
│       │   │   ├── list-<aggregate>s.query.ts
│       │   │   ├── handlers/
│       │   │   │   ├── get-<aggregate>.handler.ts
│       │   │   │   ├── list-<aggregate>s.handler.ts
│       │   │   │   └── index.ts
│       │   │   └── index.ts
│       │   ├── dto/
│       │   │   ├── create-<aggregate>.dto.ts
│       │   │   ├── update-<aggregate>.dto.ts
│       │   │   ├── <aggregate>-response.dto.ts
│       │   │   └── index.ts
│       │   ├── events/
│       │   │   ├── <aggregate>-created.handler.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── infrastructure/
│       │   ├── grpc/
│       │   │   ├── <context>.commands.grpc-controller.ts
│       │   │   ├── <context>.queries.grpc-controller.ts
│       │   │   ├── <aggregate>.grpc-mapper.ts
│       │   │   └── index.ts
│       │   ├── persistence/
│       │   │   ├── entities/
│       │   │   │   ├── <aggregate>.orm-entity.ts
│       │   │   │   └── index.ts
│       │   │   ├── repositories/
│       │   │   │   ├── <aggregate>.repository.impl.ts
│       │   │   │   └── index.ts
│       │   │   ├── migrations/
│       │   │   │   ├── <timestamp>-Create<Aggregate>sTable.ts
│       │   │   │   └── index.ts
│       │   │   └── index.ts
│       │   ├── nats/
│       │   │   ├── <aggregate>-events.listener.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       └── index.ts
├── proto/
│   └── generated/           # Copié depuis packages/proto/gen/ts
├── test/
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
├── ormconfig.ts
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── Dockerfile
└── .env.example
```

---

## Fichiers clés

### main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['<context>_commands', '<context>_queries'],
        protoPath: [
          join(__dirname, '../proto/generated/<context>_commands.proto'),
          join(__dirname, '../proto/generated/<context>_queries.proto'),
        ],
        url: `0.0.0.0:${process.env.GRPC_PORT || 50051}`,
      },
    },
  );

  await app.listen();
  console.log(`<ServiceName> gRPC server running on port ${process.env.GRPC_PORT || 50051}`);
}
bootstrap();
```

### app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { TerminusModule } from '@nestjs/terminus';
import { <Context>Module } from './<context>/<context>.module';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    CqrsModule,
    TerminusModule,
    <Context>Module,
  ],
})
export class AppModule {}
```

### <context>.module.ts

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

// Domain
import { <Aggregate>OrmEntity } from './infrastructure/persistence/entities/<aggregate>.orm-entity';

// Application - Command Handlers
import { Create<Aggregate>Handler } from './application/commands/handlers/create-<aggregate>.handler';
import { Update<Aggregate>Handler } from './application/commands/handlers/update-<aggregate>.handler';
import { Delete<Aggregate>Handler } from './application/commands/handlers/delete-<aggregate>.handler';

// Application - Query Handlers
import { Get<Aggregate>Handler } from './application/queries/handlers/get-<aggregate>.handler';
import { List<Aggregate>sHandler } from './application/queries/handlers/list-<aggregate>s.handler';

// Infrastructure
import { <Aggregate>RepositoryImpl } from './infrastructure/persistence/repositories/<aggregate>.repository.impl';
import { <Context>CommandsGrpcController } from './infrastructure/grpc/<context>.commands.grpc-controller';
import { <Context>QueriesGrpcController } from './infrastructure/grpc/<context>.queries.grpc-controller';

const CommandHandlers = [
  Create<Aggregate>Handler,
  Update<Aggregate>Handler,
  Delete<Aggregate>Handler,
];

const QueryHandlers = [
  Get<Aggregate>Handler,
  List<Aggregate>sHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([<Aggregate>OrmEntity]),
  ],
  controllers: [
    <Context>CommandsGrpcController,
    <Context>QueriesGrpcController,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: '<AGGREGATE>_REPOSITORY',
      useClass: <Aggregate>RepositoryImpl,
    },
  ],
  exports: ['<AGGREGATE>_REPOSITORY'],
})
export class <Context>Module {}
```

---

## Domain Layer

### Aggregate Root

```typescript
// domain/entities/<aggregate>.aggregate.ts
import { AggregateRoot } from '@winaity/shared-kernel';
import { <Aggregate>Id } from '@winaity/shared-kernel';
import { <Aggregate>CreatedEvent } from '../events/<aggregate>-created.event';
import { <Aggregate>UpdatedEvent } from '../events/<aggregate>-updated.event';

export interface <Aggregate>Props {
  id: <Aggregate>Id;
  userId: string;
  name: string;
  status: <Aggregate>Status;
  // ... autres propriétés
  createdAt: Date;
  updatedAt: Date;
}

export enum <Aggregate>Status {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class <Aggregate> extends AggregateRoot {
  private props: <Aggregate>Props;

  private constructor(props: <Aggregate>Props) {
    super();
    this.props = props;
  }

  // Factory method
  public static create(
    userId: string,
    name: string,
  ): <Aggregate> {
    const id = <Aggregate>Id.create();
    const now = new Date();

    const aggregate = new <Aggregate>({
      id,
      userId,
      name,
      status: <Aggregate>Status.DRAFT,
      createdAt: now,
      updatedAt: now,
    });

    aggregate.addDomainEvent(new <Aggregate>CreatedEvent(id.getValue(), name));
    return aggregate;
  }

  // Reconstitution from persistence
  public static reconstitute(props: <Aggregate>Props): <Aggregate> {
    return new <Aggregate>(props);
  }

  // Invariants / Business rules
  public activate(): void {
    if (this.props.status !== <Aggregate>Status.DRAFT) {
      throw new DomainError('Can only activate from DRAFT status');
    }
    this.props.status = <Aggregate>Status.ACTIVE;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new <Aggregate>ActivatedEvent(this.getId()));
  }

  public archive(): void {
    if (this.props.status === <Aggregate>Status.ARCHIVED) {
      throw new DomainError('Already archived');
    }
    this.props.status = <Aggregate>Status.ARCHIVED;
    this.props.updatedAt = new Date();
  }

  // Getters
  public getId(): string { return this.props.id.getValue(); }
  public getUserId(): string { return this.props.userId; }
  public getName(): string { return this.props.name; }
  public getStatus(): <Aggregate>Status { return this.props.status; }
  public getCreatedAt(): Date { return this.props.createdAt; }
  public getUpdatedAt(): Date { return this.props.updatedAt; }
}
```

### Domain Event

```typescript
// domain/events/<aggregate>-created.event.ts
import { DomainEvent } from '@winaity/shared-kernel';

export class <Aggregate>CreatedEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly name: string,
  ) {
    super();
  }
}
```

### Repository Interface

```typescript
// domain/repositories/<aggregate>.repository.ts
import { <Aggregate> } from '../entities/<aggregate>.aggregate';
import { <Aggregate>Id } from '@winaity/shared-kernel';

export interface <Aggregate>Repository {
  save(aggregate: <Aggregate>): Promise<void>;
  findById(id: <Aggregate>Id): Promise<<Aggregate> | null>;
  findByUserId(userId: string): Promise<<Aggregate>[]>;
  delete(id: <Aggregate>Id): Promise<void>;
}
```

---

## Application Layer

### Command + Handler

```typescript
// application/commands/create-<aggregate>.command.ts
export class Create<Aggregate>Command {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    // ... autres propriétés
  ) {}
}

// application/commands/handlers/create-<aggregate>.handler.ts
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Create<Aggregate>Command } from '../create-<aggregate>.command';
import { <Aggregate> } from '../../domain/entities/<aggregate>.aggregate';
import { <Aggregate>Repository } from '../../domain/repositories/<aggregate>.repository';

@CommandHandler(Create<Aggregate>Command)
export class Create<Aggregate>Handler implements ICommandHandler<Create<Aggregate>Command> {
  constructor(
    @Inject('<AGGREGATE>_REPOSITORY')
    private readonly repository: <Aggregate>Repository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: Create<Aggregate>Command): Promise<string> {
    const aggregate = <Aggregate>.create(
      command.userId,
      command.name,
    );

    await this.repository.save(aggregate);

    // Publish domain events
    aggregate.getUncommittedEvents().forEach(event => {
      this.eventBus.publish(event);
    });

    return aggregate.getId();
  }
}
```

### Query + Handler

```typescript
// application/queries/get-<aggregate>.query.ts
export class Get<Aggregate>Query {
  constructor(public readonly id: string) {}
}

// application/queries/handlers/get-<aggregate>.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Get<Aggregate>Query } from '../get-<aggregate>.query';
import { <Aggregate>ResponseDto } from '../../dto/<aggregate>-response.dto';
import { <Aggregate>Repository } from '../../domain/repositories/<aggregate>.repository';
import { <Aggregate>Id } from '@winaity/shared-kernel';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(Get<Aggregate>Query)
export class Get<Aggregate>Handler implements IQueryHandler<Get<Aggregate>Query> {
  constructor(
    @Inject('<AGGREGATE>_REPOSITORY')
    private readonly repository: <Aggregate>Repository,
  ) {}

  async execute(query: Get<Aggregate>Query): Promise<<Aggregate>ResponseDto> {
    const aggregate = await this.repository.findById(
      <Aggregate>Id.fromString(query.id)
    );

    if (!aggregate) {
      throw new NotFoundException(`<Aggregate> ${query.id} not found`);
    }

    return <Aggregate>ResponseDto.fromDomain(aggregate);
  }
}
```

---

## Infrastructure Layer

### ORM Entity

```typescript
// infrastructure/persistence/entities/<aggregate>.orm-entity.ts
import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { <Aggregate>, <Aggregate>Props, <Aggregate>Status } from '../../domain/entities/<aggregate>.aggregate';
import { <Aggregate>Id } from '@winaity/shared-kernel';

@Entity('<aggregate>s')
export class <Aggregate>OrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Mapper: Domain -> ORM
  static fromDomain(aggregate: <Aggregate>): <Aggregate>OrmEntity {
    const entity = new <Aggregate>OrmEntity();
    entity.id = aggregate.getId();
    entity.userId = aggregate.getUserId();
    entity.name = aggregate.getName();
    entity.status = aggregate.getStatus();
    entity.createdAt = aggregate.getCreatedAt();
    entity.updatedAt = aggregate.getUpdatedAt();
    return entity;
  }

  // Mapper: ORM -> Domain
  toDomain(): <Aggregate> {
    return <Aggregate>.reconstitute({
      id: <Aggregate>Id.fromString(this.id),
      userId: this.userId,
      name: this.name,
      status: this.status as <Aggregate>Status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}
```

### Repository Implementation

```typescript
// infrastructure/persistence/repositories/<aggregate>.repository.impl.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { <Aggregate>Repository } from '../../domain/repositories/<aggregate>.repository';
import { <Aggregate> } from '../../domain/entities/<aggregate>.aggregate';
import { <Aggregate>OrmEntity } from '../entities/<aggregate>.orm-entity';
import { <Aggregate>Id } from '@winaity/shared-kernel';

@Injectable()
export class <Aggregate>RepositoryImpl implements <Aggregate>Repository {
  constructor(
    @InjectRepository(<Aggregate>OrmEntity)
    private readonly repo: Repository<<Aggregate>OrmEntity>,
  ) {}

  async save(aggregate: <Aggregate>): Promise<void> {
    const entity = <Aggregate>OrmEntity.fromDomain(aggregate);
    await this.repo.save(entity);
  }

  async findById(id: <Aggregate>Id): Promise<<Aggregate> | null> {
    const entity = await this.repo.findOne({
      where: { id: id.getValue() },
    });
    return entity ? entity.toDomain() : null;
  }

  async findByUserId(userId: string): Promise<<Aggregate>[]> {
    const entities = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(e => e.toDomain());
  }

  async delete(id: <Aggregate>Id): Promise<void> {
    await this.repo.delete({ id: id.getValue() });
  }
}
```

### gRPC Controller

```typescript
// infrastructure/grpc/<context>.commands.grpc-controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CommandBus } from '@nestjs/cqrs';
import { Create<Aggregate>Command } from '../../application/commands/create-<aggregate>.command';
import { Update<Aggregate>Command } from '../../application/commands/update-<aggregate>.command';
import { Delete<Aggregate>Command } from '../../application/commands/delete-<aggregate>.command';

@Controller()
export class <Context>CommandsGrpcController {
  constructor(private readonly commandBus: CommandBus) {}

  @GrpcMethod('<Context>CommandsService', 'Create<Aggregate>')
  async create<Aggregate>(request: Create<Aggregate>Request): Promise<Create<Aggregate>Response> {
    const command = new Create<Aggregate>Command(
      request.userId,
      request.name,
    );
    const id = await this.commandBus.execute(command);
    return { id, success: true };
  }

  @GrpcMethod('<Context>CommandsService', 'Update<Aggregate>')
  async update<Aggregate>(request: Update<Aggregate>Request): Promise<Update<Aggregate>Response> {
    const command = new Update<Aggregate>Command(
      request.id,
      request.name,
    );
    await this.commandBus.execute(command);
    return { success: true };
  }

  @GrpcMethod('<Context>CommandsService', 'Delete<Aggregate>')
  async delete<Aggregate>(request: Delete<Aggregate>Request): Promise<Delete<Aggregate>Response> {
    const command = new Delete<Aggregate>Command(request.id);
    await this.commandBus.execute(command);
    return { success: true };
  }
}
```

---

## Migration TypeORM

```typescript
// infrastructure/persistence/migrations/<timestamp>-Create<Aggregate>sTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class Create<Aggregate>sTable<Timestamp> implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: '<aggregate>s',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'user_id', type: 'varchar', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'status', type: 'varchar', length: '50', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      '<aggregate>s',
      new TableIndex({ name: 'IDX_<aggregate>s_user_id', columnNames: ['user_id'] }),
    );

    await queryRunner.createIndex(
      '<aggregate>s',
      new TableIndex({ name: 'IDX_<aggregate>s_status', columnNames: ['status'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('<aggregate>s');
  }
}
```

---

## package.json

```json
{
  "name": "@winaity/<service-name>",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "proto:generate": "cp -r ../../packages/proto/gen/ts/* ./proto/generated/",
    "migration:run": "typeorm migration:run -d ./ormconfig.ts",
    "migration:revert": "typeorm migration:revert -d ./ormconfig.ts",
    "migration:generate": "typeorm migration:generate -d ./ormconfig.ts"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/cqrs": "^11.0.0",
    "@nestjs/microservices": "^11.0.0",
    "@nestjs/typeorm": "^11.0.0",
    "@nestjs/terminus": "^11.0.0",
    "@grpc/grpc-js": "^1.14.0",
    "@grpc/proto-loader": "^0.8.0",
    "@winaity/shared-kernel": "workspace:*",
    "typeorm": "^0.3.19",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/proto ./proto
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production

EXPOSE 50051

CMD ["node", "dist/main.js"]
```
