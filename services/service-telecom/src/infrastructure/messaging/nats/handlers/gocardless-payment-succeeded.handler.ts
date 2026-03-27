import { Injectable, OnModuleInit } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  type GoCardlessPaymentSucceededEventPayload,
  ProvisioningSagaService,
} from '../../../../domain/provisioning/services';

@Injectable()
export class GoCardlessPaymentSucceededHandler implements OnModuleInit {
  constructor(
    private readonly natsService: NatsService,
    private readonly sagaService: ProvisioningSagaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.natsService.subscribe<GoCardlessPaymentSucceededEventPayload>(
      'payment.gocardless.succeeded',
      this.handle.bind(this),
    );
  }

  async handle(payload: GoCardlessPaymentSucceededEventPayload): Promise<void> {
    await this.sagaService.registerGoCardlessPaymentSucceeded(payload);
  }
}
