import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { ScheduleController } from './controllers/schedule.controller';
import { PaymentIntentController } from './controllers/payment-intent.controller';
import { PaymentEventController } from './controllers/payment-event.controller';
import { StripeController } from './controllers/stripe.controller';
import { StripeAccountController } from './controllers/stripe-account.controller';
import { GoCardlessAccountController } from './controllers/gocardless-account.controller';
import { EmerchantpayAccountController } from './controllers/emerchantpay-account.controller';
import { SlimpayAccountController } from './controllers/slimpay-account.controller';
import { MultisafepayAccountController } from './controllers/multisafepay-account.controller';
import { PaypalAccountController } from './controllers/paypal-account.controller';
import { PaypalController } from './controllers/paypal.controller';
import { PspAccountsController } from './controllers/psp-accounts.controller';

// Entities
import { ScheduleEntity } from '../../../db/entities/schedule.entity';
import { PaymentIntentEntity } from '../../../db/entities/payment-intent.entity';
import { PaymentEventEntity } from '../../../db/entities/payment-event.entity';
import { ContratEntity } from '../../../db/entities/contrat.entity';
import { StripeAccountEntity } from '../../../db/entities/stripe-account.entity';
import { GoCardlessAccountEntity } from '../../../db/entities/gocardless-account.entity';
import { EmerchantpayAccountEntity } from '../../../db/entities/emerchantpay-account.entity';
import { SlimpayAccountEntity } from '../../../db/entities/slimpay-account.entity';
import { MultisafepayAccountEntity } from '../../../db/entities/multisafepay-account.entity';
import { PaypalAccountEntity } from '../../../db/entities/paypal-account.entity';

// Repositories
import { TypeOrmScheduleRepository } from '../../../repositories/typeorm-schedule.repository';
import { TypeOrmPaymentIntentRepository } from '../../../repositories/typeorm-payment-intent.repository';
import { TypeOrmPaymentEventRepository } from '../../../repositories/typeorm-payment-event.repository';
import { TypeOrmContratRepository } from '../../../repositories/typeorm-contrat.repository';
import { TypeOrmStripeAccountRepository } from '../../../repositories/typeorm-stripe-account.repository';
import { TypeOrmGoCardlessAccountRepository } from '../../../repositories/typeorm-gocardless-account.repository';
import { TypeOrmEmerchantpayAccountRepository } from '../../../repositories/typeorm-emerchantpay-account.repository';
import { TypeOrmSlimpayAccountRepository } from '../../../repositories/typeorm-slimpay-account.repository';
import { TypeOrmMultisafepayAccountRepository } from '../../../repositories/typeorm-multisafepay-account.repository';
import { TypeOrmPaypalAccountRepository } from '../../../repositories/typeorm-paypal-account.repository';

// Use Cases - Schedule
import { CreateScheduleUseCase } from '../../../../applications/usecase/schedule/create-schedule.usecase';
import { GetScheduleUseCase } from '../../../../applications/usecase/schedule/get-schedule.usecase';
import { UpdateScheduleUseCase } from '../../../../applications/usecase/schedule/update-schedule.usecase';
import { DeleteScheduleUseCase } from '../../../../applications/usecase/schedule/delete-schedule.usecase';
import { RenewScheduleUseCase } from '../../../../applications/usecase/schedule/renew-schedule.usecase';

// Use Cases - PaymentIntent
import { CreatePaymentIntentUseCase } from '../../../../applications/usecase/payment-intent/create-payment-intent.usecase';
import { GetPaymentIntentUseCase } from '../../../../applications/usecase/payment-intent/get-payment-intent.usecase';
import { UpdatePaymentIntentUseCase } from '../../../../applications/usecase/payment-intent/update-payment-intent.usecase';
import { DeletePaymentIntentUseCase } from '../../../../applications/usecase/payment-intent/delete-payment-intent.usecase';

// Use Cases - PaymentEvent
import { CreatePaymentEventUseCase } from '../../../../applications/usecase/payment-event/create-payment-event.usecase';
import { GetPaymentEventUseCase } from '../../../../applications/usecase/payment-event/get-payment-event.usecase';
import { UpdatePaymentEventUseCase } from '../../../../applications/usecase/payment-event/update-payment-event.usecase';
import { DeletePaymentEventUseCase } from '../../../../applications/usecase/payment-event/delete-payment-event.usecase';

// Use Cases - StripeAccount
import {
  CreateStripeAccountUseCase,
  GetStripeAccountUseCase,
  UpdateStripeAccountUseCase,
  DeleteStripeAccountUseCase,
} from '../../../../applications/usecase/stripe-account';

// Use Cases - GoCardlessAccount
import {
  CreateGoCardlessAccountUseCase,
  GetGoCardlessAccountUseCase,
  UpdateGoCardlessAccountUseCase,
  DeleteGoCardlessAccountUseCase,
} from '../../../../applications/usecase/gocardless-account';

// Use Cases - EmerchantpayAccount
import {
  CreateEmerchantpayAccountUseCase,
  GetEmerchantpayAccountUseCase,
  UpdateEmerchantpayAccountUseCase,
  DeleteEmerchantpayAccountUseCase,
} from '../../../../applications/usecase/emerchantpay-account';

// Use Cases - SlimpayAccount
import {
  CreateSlimpayAccountUseCase,
  GetSlimpayAccountUseCase,
  UpdateSlimpayAccountUseCase,
  DeleteSlimpayAccountUseCase,
} from '../../../../applications/usecase/slimpay-account';

// Use Cases - MultisafepayAccount
import {
  CreateMultisafepayAccountUseCase,
  GetMultisafepayAccountUseCase,
  UpdateMultisafepayAccountUseCase,
  DeleteMultisafepayAccountUseCase,
} from '../../../../applications/usecase/multisafepay-account';

// Use Cases - PaypalAccount
import {
  CreatePaypalAccountUseCase,
  GetPaypalAccountUseCase,
  UpdatePaypalAccountUseCase,
  DeletePaypalAccountUseCase,
} from '../../../../applications/usecase/paypal-account';

// Stripe Services
import { StripeService } from '../../../services/stripe/stripe.service';
import { StripeWebhookService } from '../../../services/stripe/stripe-webhook.service';

// PayPal Services
import { PaypalService } from '../../../services/paypal/paypal.service';
import { PaypalWebhookService } from '../../../services/paypal/paypal-webhook.service';

// Scheduler Service
import { PaymentSchedulerService } from '../../../services/payment-scheduler.service';

// GoCardless Module (for GoCardlessService)
import { GoCardlessModule } from '../gocardless';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ScheduleEntity,
      PaymentIntentEntity,
      PaymentEventEntity,
      ContratEntity, // For updating Contrat status when Schedule expires
      StripeAccountEntity,
      GoCardlessAccountEntity,
      EmerchantpayAccountEntity,
      SlimpayAccountEntity,
      MultisafepayAccountEntity,
      PaypalAccountEntity,
    ]),
    GoCardlessModule, // For GoCardlessService used in PaymentSchedulerService
  ],
  controllers: [
    ScheduleController,
    PaymentIntentController,
    PaymentEventController,
    StripeController,
    StripeAccountController,
    GoCardlessAccountController,
    EmerchantpayAccountController,
    SlimpayAccountController,
    MultisafepayAccountController,
    PaypalAccountController,
    PaypalController,
    PspAccountsController,
  ],
  providers: [
    // Schedule
    {
      provide: 'ScheduleRepositoryPort',
      useClass: TypeOrmScheduleRepository,
    },
    CreateScheduleUseCase,
    GetScheduleUseCase,
    UpdateScheduleUseCase,
    DeleteScheduleUseCase,
    RenewScheduleUseCase,

    // Contrat (for RenewScheduleUseCase)
    {
      provide: 'ContratRepositoryPort',
      useClass: TypeOrmContratRepository,
    },

    // PaymentIntent
    {
      provide: 'PaymentIntentRepositoryPort',
      useClass: TypeOrmPaymentIntentRepository,
    },
    CreatePaymentIntentUseCase,
    GetPaymentIntentUseCase,
    UpdatePaymentIntentUseCase,
    DeletePaymentIntentUseCase,

    // PaymentEvent
    {
      provide: 'PaymentEventRepositoryPort',
      useClass: TypeOrmPaymentEventRepository,
    },
    CreatePaymentEventUseCase,
    GetPaymentEventUseCase,
    UpdatePaymentEventUseCase,
    DeletePaymentEventUseCase,

    // StripeAccount
    {
      provide: 'StripeAccountRepositoryPort',
      useClass: TypeOrmStripeAccountRepository,
    },
    CreateStripeAccountUseCase,
    GetStripeAccountUseCase,
    UpdateStripeAccountUseCase,
    DeleteStripeAccountUseCase,

    // GoCardlessAccount
    {
      provide: 'GoCardlessAccountRepositoryPort',
      useClass: TypeOrmGoCardlessAccountRepository,
    },
    CreateGoCardlessAccountUseCase,
    GetGoCardlessAccountUseCase,
    UpdateGoCardlessAccountUseCase,
    DeleteGoCardlessAccountUseCase,

    // EmerchantpayAccount
    {
      provide: 'EmerchantpayAccountRepositoryPort',
      useClass: TypeOrmEmerchantpayAccountRepository,
    },
    CreateEmerchantpayAccountUseCase,
    GetEmerchantpayAccountUseCase,
    UpdateEmerchantpayAccountUseCase,
    DeleteEmerchantpayAccountUseCase,

    // SlimpayAccount
    {
      provide: 'SlimpayAccountRepositoryPort',
      useClass: TypeOrmSlimpayAccountRepository,
    },
    CreateSlimpayAccountUseCase,
    GetSlimpayAccountUseCase,
    UpdateSlimpayAccountUseCase,
    DeleteSlimpayAccountUseCase,

    // MultisafepayAccount
    {
      provide: 'MultisafepayAccountRepositoryPort',
      useClass: TypeOrmMultisafepayAccountRepository,
    },
    CreateMultisafepayAccountUseCase,
    GetMultisafepayAccountUseCase,
    UpdateMultisafepayAccountUseCase,
    DeleteMultisafepayAccountUseCase,

    // PaypalAccount
    {
      provide: 'PaypalAccountRepositoryPort',
      useClass: TypeOrmPaypalAccountRepository,
    },
    CreatePaypalAccountUseCase,
    GetPaypalAccountUseCase,
    UpdatePaypalAccountUseCase,
    DeletePaypalAccountUseCase,

    // Stripe Services
    StripeService,
    StripeWebhookService,

    // PayPal Services
    PaypalService,
    PaypalWebhookService,

    // Payment Scheduler (CRON job for automatic payment processing)
    PaymentSchedulerService,
  ],
  exports: [
    'ScheduleRepositoryPort',
    'PaymentIntentRepositoryPort',
    'PaymentEventRepositoryPort',
    'StripeAccountRepositoryPort',
    'GoCardlessAccountRepositoryPort',
    'EmerchantpayAccountRepositoryPort',
    'SlimpayAccountRepositoryPort',
    'MultisafepayAccountRepositoryPort',
    'PaypalAccountRepositoryPort',
    StripeService,
    PaypalService,
    PaymentSchedulerService,
  ],
})
export class PaymentModule {}
