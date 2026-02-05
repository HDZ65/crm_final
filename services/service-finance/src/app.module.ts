import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule } from '@crm/nats-utils';

// ============================================================================
// FACTURES MODULES (from service-factures)
// ============================================================================
import { FactureModule } from './modules/facture/facture.module';
import { LigneFactureModule } from './modules/ligne-facture/ligne-facture.module';
import { StatutFactureModule } from './modules/statut-facture/statut-facture.module';
import { EmissionFactureModule } from './modules/emission-facture/emission-facture.module';
import { FactureSettingsModule } from './modules/facture-settings/facture-settings.module';
import { GenerationModule } from './modules/generation/generation.module';
// PDF Generation and Compliance modules don't have module.ts - just services
// InvoicesModule is separate from FactureModule

// ============================================================================
// PAYMENTS MODULES (from service-payments)
// ============================================================================
import { StripeModule } from './modules/stripe/stripe.module';
import { PaypalModule } from './modules/paypal/paypal.module';
import { GoCardlessModule } from './modules/gocardless/gocardless.module';
import { SlimpayModule } from './modules/slimpay/slimpay.module';
import { MultiSafepayModule } from './modules/multisafepay/multisafepay.module';
import { EmerchantpayModule } from './modules/emerchantpay/emerchantpay.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { PortalModule } from './modules/portal/portal.module';
import { CalendarModule } from './modules/calendar/calendar.module'; // gRPC client to calendar
import { RetryModule } from './modules/retry/retry.module'; // gRPC client to retry
import { PspAccountsModule } from './modules/psp-accounts/psp-accounts.module';
import { PaymentEmissionModule } from './modules/payment-emission/payment-emission.module';
import { EventsModule } from './modules/events/events.module'; // NATS event handlers
import { PaymentAuditModule } from './modules/payment-audit/audit.module';

// ============================================================================
// CALENDAR MODULES (from service-calendar)
// ============================================================================
import { EngineModule } from './modules/engine/engine.module';
import { ConfigurationModule } from './modules/configuration/configuration.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { CsvImportModule } from './modules/csv-import/csv-import.module';
import { CalendarAuditModule } from './modules/calendar-audit/audit.module';

// Portal Controller (HTTP endpoints)
import { PortalController } from './modules/portal/portal.controller';

@Module({
  imports: [
    // ========================================================================
    // CORE INFRASTRUCTURE
    // ========================================================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'finance_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true, // Auto-discovers entities from TypeOrmModule.forFeature()
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          max: 20, // Increased pool for consolidated service
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),

    // ========================================================================
    // FACTURES MODULES
    // ========================================================================
    StatutFactureModule,
    EmissionFactureModule,
    LigneFactureModule,
    FactureModule,
    FactureSettingsModule,
    GenerationModule,

    // ========================================================================
    // PAYMENTS MODULES (PSP integrations)
    // ========================================================================
    StripeModule,
    PaypalModule,
    GoCardlessModule,
    SlimpayModule,
    MultiSafepayModule,
    EmerchantpayModule,

    // ========================================================================
    // PAYMENTS MODULES (Core functionality)
    // ========================================================================
    SchedulesModule,
    PortalModule,
    CalendarModule, // gRPC client for calendar service (internal call)
    RetryModule, // gRPC client for retry service (internal call)
    PspAccountsModule,
    PaymentEmissionModule,
    EventsModule,
    PaymentAuditModule, // Global audit module for payments

    // ========================================================================
    // CALENDAR MODULES
    // ========================================================================
    EngineModule,
    ConfigurationModule,
    HolidaysModule,
    CsvImportModule,
    CalendarAuditModule,
  ],

  controllers: [PortalController],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
