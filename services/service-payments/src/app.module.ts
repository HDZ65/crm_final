import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Feature Modules
import { StripeModule } from './modules/stripe/stripe.module';
import { PaypalModule } from './modules/paypal/paypal.module';
import { GoCardlessModule } from './modules/gocardless/gocardless.module';
import { SlimpayModule } from './modules/slimpay/slimpay.module';
import { MultiSafepayModule } from './modules/multisafepay/multisafepay.module';
import { EmerchantpayModule } from './modules/emerchantpay/emerchantpay.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { PortalModule } from './modules/portal/portal.module';
import { AuditModule } from './modules/audit/audit.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { RetryModule } from './modules/retry/retry.module';

// Entities
import { StripeAccountEntity } from './modules/stripe/entities/stripe-account.entity';
import { PaypalAccountEntity } from './modules/paypal/entities/paypal-account.entity';
import { GoCardlessAccountEntity } from './modules/gocardless/entities/gocardless-account.entity';
import { GoCardlessMandateEntity } from './modules/gocardless/entities/gocardless-mandate.entity';
import { ScheduleEntity } from './modules/schedules/entities/schedule.entity';
import { PaymentIntentEntity } from './modules/schedules/entities/payment-intent.entity';
import { PaymentEventEntity } from './modules/schedules/entities/payment-event.entity';
import { PortalPaymentSessionEntity } from './modules/portal/entities/portal-session.entity';
import { PortalSessionAuditEntity } from './modules/portal/entities/portal-session-audit.entity';
import { PSPEventInboxEntity } from './modules/portal/entities/psp-event-inbox.entity';
import { PaymentAuditLogEntity } from './modules/audit/entities/payment-audit-log.entity';
import { SlimpayAccountEntity } from './modules/slimpay/entities/slimpay-account.entity';
import { MultiSafepayAccountEntity } from './modules/multisafepay/entities/multisafepay-account.entity';
import { EmerchantpayAccountEntity } from './modules/emerchantpay/entities/emerchantpay-account.entity';

// Portal Controller
import { PortalController } from './modules/portal/portal.controller';
import { PspAccountsModule } from './modules/psp-accounts/psp-accounts.module';

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
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
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
    PspAccountsModule,
  ],
  controllers: [PortalController],
  providers: [],
})
export class AppModule {}
