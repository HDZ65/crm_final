import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NatsModule, NatsService } from '@crm/shared-kernel';
import { NATS_OPTIONS } from '@crm/shared-kernel';
import { NatsPublisherService } from './nats-publisher.service';

/**
 * SafeNatsService wraps NatsService to catch connection errors during startup.
 * This allows the gateway to start even when NATS is unavailable.
 */
class SafeNatsService extends NatsService {
  override async onModuleInit(): Promise<void> {
    try {
      await super.onModuleInit();
    } catch (error) {
      // NATS unavailable at startup — gateway continues without NATS
      // The logger from parent class will have already logged the error
    }
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: NATS_OPTIONS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.get<string>('NATS_URL', 'nats://localhost:4222'),
        maxReconnectAttempts: 3,
      }),
    },
    {
      provide: NatsService,
      useClass: SafeNatsService,
    },
    NatsPublisherService,
  ],
  exports: [NatsPublisherService],
})
export class NatsPublisherModule {}
