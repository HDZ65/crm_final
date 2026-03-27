import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './outbox.entity.js';
import { OutboxService } from './outbox.service.js';

/**
 * Outbox Module
 *
 * Provides the Transactional Outbox pattern for reliable event publishing.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     OutboxModule,
 *     // ... other imports
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule implements OnModuleInit {
  constructor(private readonly outboxService: OutboxService) {}

  onModuleInit(): void {
    // Start the outbox processor when the module initializes
    // Process every 1 second
    this.outboxService.startProcessor(1000);
  }
}
