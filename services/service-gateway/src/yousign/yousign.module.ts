import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NatsPublisherModule } from '../nats/nats-publisher.module';
import { YousignApiClient } from './yousign-api.client';
import { YousignController } from './yousign.controller';
import { YousignWebhookController } from './yousign-webhook.controller';
import { SepaMandateService } from './sepa-mandate.service';

@Module({
  imports: [AuthModule, NatsPublisherModule],
  controllers: [YousignController, YousignWebhookController],
  providers: [YousignApiClient, SepaMandateService],
  exports: [YousignApiClient, SepaMandateService],
})
export class YousignModule {}
