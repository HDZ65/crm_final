# Task 2 - Core Subscription Entities (Code Ready to Create)

## Status: BLOCKED - Need execution agent

The following files need to be created by an execution agent (Sisyphus).

---

## File 1: subscription.entity.ts

**Path**: `services/service-commercial/src/domain/subscriptions/entities/subscription.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SubscriptionLineEntity } from './subscription-line.entity';
import { SubscriptionHistoryEntity } from './subscription-history.entity';

@Entity('subscriptions')
@Index(['organisationId'])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @Column({ name: 'contrat_id', type: 'uuid', nullable: true })
  contratId: string | null;

  @Column({ type: 'varchar', length: 50 })
  status: string; // PENDING, ACTIVE, PAUSED, PAST_DUE, CANCELED, EXPIRED

  @Column({ type: 'varchar', length: 50 })
  frequency: string; // WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY, QUARTERLY, ANNUAL

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  currency: string;

  @Column({ name: 'start_date', type: 'varchar', length: 50 })
  startDate: string;

  @Column({ name: 'end_date', type: 'varchar', length: 50, nullable: true })
  endDate: string | null;

  @Column({ name: 'paused_at', type: 'varchar', length: 50, nullable: true })
  pausedAt: string | null;

  @Column({ name: 'resumed_at', type: 'varchar', length: 50, nullable: true })
  resumedAt: string | null;

  @Column({ name: 'next_charge_at', type: 'varchar', length: 50 })
  nextChargeAt: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SubscriptionLineEntity, (line) => line.subscription)
  lines: SubscriptionLineEntity[];

  @OneToMany(() => SubscriptionHistoryEntity, (hist) => hist.subscription)
  history: SubscriptionHistoryEntity[];
}
```

---

## File 2: subscription-line.entity.ts

**Path**: `services/service-commercial/src/domain/subscriptions/entities/subscription-line.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity('subscription_lines')
export class SubscriptionLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'produit_id', type: 'uuid' })
  produitId: string;

  @Column({ type: 'int' })
  quantite: number;

  @Column({ name: 'prix_unitaire', type: 'decimal', precision: 15, scale: 2 })
  prixUnitaire: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => SubscriptionEntity, (sub) => sub.lines)
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;
}
```

---

## File 3: subscription-history.entity.ts

**Path**: `services/service-commercial/src/domain/subscriptions/entities/subscription-history.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity('subscription_history')
export class SubscriptionHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId: string;

  @Column({ name: 'old_status', type: 'varchar', length: 50 })
  oldStatus: string;

  @Column({ name: 'new_status', type: 'varchar', length: 50 })
  newStatus: string;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SubscriptionEntity, (sub) => sub.history)
  @JoinColumn({ name: 'subscription_id' })
  subscription: SubscriptionEntity;
}
```

---

## File 4: entities/index.ts (UPDATE)

**Path**: `services/service-commercial/src/domain/subscriptions/entities/index.ts`

```typescript
// Core subscription entities
export * from './subscription.entity';
export * from './subscription-line.entity';
export * from './subscription-history.entity';

// Preference entities (already exist)
export * from './subscription-preference.entity';
export * from './subscription-preference-schema.entity';
export * from './subscription-preference-history.entity';
```

---

## File 5: ISubscriptionRepository.ts

**Path**: `services/service-commercial/src/domain/subscriptions/repositories/ISubscriptionRepository.ts`

```typescript
import { SubscriptionEntity } from '../entities/subscription.entity';

export interface ISubscriptionRepository {
  findById(id: string): Promise<SubscriptionEntity | null>;
  findByIdWithDetails(id: string): Promise<SubscriptionEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    clientId?: string;
    contratId?: string;
    status?: string;
  }, pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    subscriptions: SubscriptionEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  findDueForCharge(organisationId: string, beforeDate: string): Promise<SubscriptionEntity[]>;
  save(entity: SubscriptionEntity): Promise<SubscriptionEntity>;
  updateStatus(id: string, status: string): Promise<SubscriptionEntity>;
  delete(id: string): Promise<void>;
}
```

---

## File 6: ISubscriptionLineRepository.ts

**Path**: `services/service-commercial/src/domain/subscriptions/repositories/ISubscriptionLineRepository.ts`

```typescript
import { SubscriptionLineEntity } from '../entities/subscription-line.entity';

export interface ISubscriptionLineRepository {
  findById(id: string): Promise<SubscriptionLineEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionLineEntity[]>;
  save(entity: SubscriptionLineEntity): Promise<SubscriptionLineEntity>;
  delete(id: string): Promise<void>;
}
```

---

## File 7: ISubscriptionHistoryRepository.ts

**Path**: `services/service-commercial/src/domain/subscriptions/repositories/ISubscriptionHistoryRepository.ts`

```typescript
import { SubscriptionHistoryEntity } from '../entities/subscription-history.entity';

export interface ISubscriptionHistoryRepository {
  findById(id: string): Promise<SubscriptionHistoryEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionHistoryEntity[]>;
  save(entity: SubscriptionHistoryEntity): Promise<SubscriptionHistoryEntity>;
  delete(id: string): Promise<void>;
}
```

---

## File 8: repositories/index.ts

**Path**: `services/service-commercial/src/domain/subscriptions/repositories/index.ts`

```typescript
export * from './ISubscriptionRepository';
export * from './ISubscriptionLineRepository';
export * from './ISubscriptionHistoryRepository';
```

---

## Execution Instructions

Run `/start-work` in a new session to continue. The boulder is already configured at `.sisyphus/boulder.json`.

The execution agent should:
1. Create the 8 files above
2. Mark Task 2 as complete in the plan
3. Continue with Task 3 (state machine) which depends on Task 2
