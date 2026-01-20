import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentGrpcController } from './payment.grpc.controller';

// Services
import { StripeService } from '../../services/stripe/stripe.service';
import { StripeWebhookService } from '../../services/stripe/stripe-webhook.service';
import { PaypalService } from '../../services/paypal/paypal.service';
import { PaypalWebhookService } from '../../services/paypal/paypal-webhook.service';

// TypeORM Entities
import { ScheduleEntity } from '../../db/entities/schedule.entity';
import { PaymentIntentEntity } from '../../db/entities/payment-intent.entity';
import { PaymentEventEntity } from '../../db/entities/payment-event.entity';
import { StripeAccountEntity } from '../../db/entities/stripe-account.entity';
import { PaypalAccountEntity } from '../../db/entities/paypal-account.entity';
import { GoCardlessAccountEntity } from '../../db/entities/gocardless-account.entity';
import { GoCardlessMandateEntity } from '../../db/entities/gocardless-mandate.entity';

// Repositories
import { TypeOrmScheduleRepository } from '../../repositories/typeorm-schedule.repository';
import { TypeOrmPaymentIntentRepository } from '../../repositories/typeorm-payment-intent.repository';
import { TypeOrmPaymentEventRepository } from '../../repositories/typeorm-payment-event.repository';
import { TypeOrmStripeAccountRepository } from '../../repositories/typeorm-stripe-account.repository';
import { TypeOrmPaypalAccountRepository } from '../../repositories/typeorm-paypal-account.repository';
import { TypeOrmGoCardlessAccountRepository } from '../../repositories/typeorm-gocardless-account.repository';
import { TypeOrmGoCardlessMandateRepository } from '../../repositories/typeorm-gocardless-mandate.repository';

// Mappers needed by services
import { StripeAccountMapper } from '../../../applications/mapper/stripe-account.mapper';
import { PaypalAccountMapper } from '../../../applications/mapper/paypal-account.mapper';
import { GoCardlessAccountMapper } from '../../../applications/mapper/gocardless-account.mapper';
import { GoCardlessMandateMapper } from '../../../applications/mapper/gocardless-mandate.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleEntity,
      PaymentIntentEntity,
      PaymentEventEntity,
      StripeAccountEntity,
      PaypalAccountEntity,
      GoCardlessAccountEntity,
      GoCardlessMandateEntity,
    ]),
  ],
  controllers: [PaymentGrpcController],
  providers: [
    // Services
    StripeService,
    StripeWebhookService,
    PaypalService,
    PaypalWebhookService,

    // Mappers needed by repositories
    StripeAccountMapper,
    PaypalAccountMapper,
    GoCardlessAccountMapper,
    GoCardlessMandateMapper,

    // Repository Ports
    {
      provide: 'ScheduleRepositoryPort',
      useClass: TypeOrmScheduleRepository,
    },
    {
      provide: 'PaymentIntentRepositoryPort',
      useClass: TypeOrmPaymentIntentRepository,
    },
    {
      provide: 'PaymentEventRepositoryPort',
      useClass: TypeOrmPaymentEventRepository,
    },
    {
      provide: 'StripeAccountRepositoryPort',
      useClass: TypeOrmStripeAccountRepository,
    },
    {
      provide: 'PaypalAccountRepositoryPort',
      useClass: TypeOrmPaypalAccountRepository,
    },
    {
      provide: 'GoCardlessAccountRepositoryPort',
      useClass: TypeOrmGoCardlessAccountRepository,
    },
    {
      provide: 'GoCardlessMandateRepositoryPort',
      useClass: TypeOrmGoCardlessMandateRepository,
    },
  ],
  exports: [
    StripeService,
    PaypalService,
    'ScheduleRepositoryPort',
    'PaymentIntentRepositoryPort',
    'PaymentEventRepositoryPort',
    'StripeAccountRepositoryPort',
    'PaypalAccountRepositoryPort',
    'GoCardlessAccountRepositoryPort',
  ],
})
export class PaymentGrpcModule {}
