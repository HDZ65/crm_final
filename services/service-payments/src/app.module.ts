import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Feature Modules
import { StripeModule } from './modules/stripe/stripe.module.js';
import { PaypalModule } from './modules/paypal/paypal.module.js';
import { GoCardlessModule } from './modules/gocardless/gocardless.module.js';
import { SlimpayModule } from './modules/slimpay/slimpay.module.js';
import { MultiSafepayModule } from './modules/multisafepay/multisafepay.module.js';
import { EmerchantpayModule } from './modules/emerchantpay/emerchantpay.module.js';
import { SchedulesModule } from './modules/schedules/schedules.module.js';
import { PortalModule } from './modules/portal/portal.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { RetryModule } from './modules/retry/retry.module.js';

// Entities
import { StripeAccountEntity } from './modules/stripe/entities/stripe-account.entity.js';
import { PaypalAccountEntity } from './modules/paypal/entities/paypal-account.entity.js';
import { GoCardlessAccountEntity } from './modules/gocardless/entities/gocardless-account.entity.js';
import { GoCardlessMandateEntity } from './modules/gocardless/entities/gocardless-mandate.entity.js';
import { ScheduleEntity } from './modules/schedules/entities/schedule.entity.js';
import { PaymentIntentEntity } from './modules/schedules/entities/payment-intent.entity.js';
import { PaymentEventEntity } from './modules/schedules/entities/payment-event.entity.js';
import { PortalPaymentSessionEntity } from './modules/portal/entities/portal-session.entity.js';
import { PortalSessionAuditEntity } from './modules/portal/entities/portal-session-audit.entity.js';
import { PSPEventInboxEntity } from './modules/portal/entities/psp-event-inbox.entity.js';
import { PaymentAuditLogEntity } from './modules/audit/entities/payment-audit-log.entity.js';
import { SlimpayAccountEntity } from './modules/slimpay/entities/slimpay-account.entity.js';
import { MultiSafepayAccountEntity } from './modules/multisafepay/entities/multisafepay-account.entity.js';
import { EmerchantpayAccountEntity } from './modules/emerchantpay/entities/emerchantpay-account.entity.js';

// Payment gRPC Controller
import { PaymentController } from './payment.controller.js';
import { PortalController } from './modules/portal/portal.controller.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'payments_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          StripeAccountEntity,
          PaypalAccountEntity,
          GoCardlessAccountEntity,
          GoCardlessMandateEntity,
          ScheduleEntity,
          PaymentIntentEntity,
          PaymentEventEntity,
          PortalPaymentSessionEntity,
          PortalSessionAuditEntity,
          PSPEventInboxEntity,
          PaymentAuditLogEntity,
          SlimpayAccountEntity,
          MultiSafepayAccountEntity,
          EmerchantpayAccountEntity,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

// Feature Modules
    StripeModule,
    PaypalModule,
    GoCardlessModule,
    SlimpayModule,
    MultiSafepayModule,
    EmerchantpayModule,
    SchedulesModule,
    PortalModule,
    AuditModule,
    CalendarModule,
    RetryModule,
  ],
  controllers: [PaymentController, PortalController],
  providers: [],
})
export class AppModule {}
