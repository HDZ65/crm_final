import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Factures entities
import { FactureEntity } from './domain/factures/entities/facture.entity';
import { LigneFactureEntity } from './domain/factures/entities/ligne-facture.entity';
import { StatutFactureEntity } from './domain/factures/entities/statut-facture.entity';
import { EmissionFactureEntity } from './domain/factures/entities/emission-facture.entity';
import { FactureSettingsEntity } from './domain/factures/entities/facture-settings.entity';
import { InvoiceEntity } from './domain/factures/entities/invoice.entity';
import { InvoiceItemEntity } from './domain/factures/entities/invoice-item.entity';
import { RegleRelanceEntity } from './domain/factures/entities/regle-relance.entity';
import { HistoriqueRelanceEntity } from './domain/factures/entities/historique-relance.entity';

// Payments entities
import { ScheduleEntity } from './domain/payments/entities/schedule.entity';
import { PaymentIntentEntity } from './domain/payments/entities/payment-intent.entity';
import { PaymentEventEntity } from './domain/payments/entities/payment-event.entity';
import { PortalPaymentSessionEntity } from './domain/payments/entities/portal-session.entity';
import { PortalSessionAuditEntity } from './domain/payments/entities/portal-session-audit.entity';
import { PSPEventInboxEntity } from './domain/payments/entities/psp-event-inbox.entity';
import { StripeAccountEntity } from './domain/payments/entities/stripe-account.entity';
import { PaypalAccountEntity } from './domain/payments/entities/paypal-account.entity';
import { GoCardlessAccountEntity } from './domain/payments/entities/gocardless-account.entity';
import { GoCardlessMandateEntity } from './domain/payments/entities/gocardless-mandate.entity';
import { SlimpayAccountEntity } from './domain/payments/entities/slimpay-account.entity';
import { MultiSafepayAccountEntity } from './domain/payments/entities/multisafepay-account.entity';
import { EmerchantpayAccountEntity } from './domain/payments/entities/emerchantpay-account.entity';
import { RetryPolicyEntity } from './domain/payments/entities/retry-policy.entity';
import { RetryScheduleEntity } from './domain/payments/entities/retry-schedule.entity';
import { RetryJobEntity } from './domain/payments/entities/retry-job.entity';
import { RetryAttemptEntity } from './domain/payments/entities/retry-attempt.entity';
import { ReminderPolicyEntity } from './domain/payments/entities/reminder-policy.entity';
import { ReminderEntity } from './domain/payments/entities/reminder.entity';
import { RetryAuditLogEntity } from './domain/payments/entities/retry-audit-log.entity';
import { PaymentAuditLogEntity } from './domain/payments/entities/payment-audit-log.entity';
import { PaymentStatusEntity } from './domain/payments/entities/payment-status.entity';
import { RejectionReasonEntity } from './domain/payments/entities/rejection-reason.entity';
import { ProviderRoutingRuleEntity } from './domain/payments/entities/provider-routing-rule.entity';
import { ProviderOverrideEntity } from './domain/payments/entities/provider-override.entity';
import { ProviderReassignmentJobEntity } from './domain/payments/entities/provider-reassignment-job.entity';
import { ExportJobEntity } from './domain/payments/entities/export-job.entity';
import { RiskScoreEntity } from './domain/payments/entities/risk-score.entity';
import { DunningConfigEntity } from './domain/payments/entities/dunning-config.entity';
import { ProviderStatusMappingEntity } from './domain/payments/entities/provider-status-mapping.entity';
import { CustomerInteractionEntity } from './domain/payments/entities/customer-interaction.entity';
import { ReconciliationEntity } from './domain/payments/entities/reconciliation.entity';
import { PaymentArchiveEntity } from './domain/payments/entities/payment-archive.entity';

// Calendar entities
import { SystemDebitConfigurationEntity } from './domain/calendar/entities/system-debit-configuration.entity';
import { CutoffConfigurationEntity } from './domain/calendar/entities/cutoff-configuration.entity';
import { CompanyDebitConfigurationEntity } from './domain/calendar/entities/company-debit-configuration.entity';
import { ClientDebitConfigurationEntity } from './domain/calendar/entities/client-debit-configuration.entity';
import { ContractDebitConfigurationEntity } from './domain/calendar/entities/contract-debit-configuration.entity';
import { HolidayZoneEntity } from './domain/calendar/entities/holiday-zone.entity';
import { HolidayEntity } from './domain/calendar/entities/holiday.entity';
import { PlannedDebitEntity } from './domain/calendar/entities/planned-debit.entity';
import { VolumeForecastEntity } from './domain/calendar/entities/volume-forecast.entity';
import { VolumeThresholdEntity } from './domain/calendar/entities/volume-threshold.entity';
import { CalendarAuditLogEntity } from './domain/calendar/entities/calendar-audit-log.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'finance_db',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    // Factures
    FactureEntity,
    LigneFactureEntity,
    StatutFactureEntity,
    EmissionFactureEntity,
    FactureSettingsEntity,
    InvoiceEntity,
    InvoiceItemEntity,
    RegleRelanceEntity,
    HistoriqueRelanceEntity,
    // Payments
    ScheduleEntity,
    PaymentIntentEntity,
    PaymentEventEntity,
    PortalPaymentSessionEntity,
    PortalSessionAuditEntity,
    PSPEventInboxEntity,
    StripeAccountEntity,
    PaypalAccountEntity,
    GoCardlessAccountEntity,
    GoCardlessMandateEntity,
    SlimpayAccountEntity,
    MultiSafepayAccountEntity,
    EmerchantpayAccountEntity,
    RetryPolicyEntity,
    RetryScheduleEntity,
    RetryJobEntity,
    RetryAttemptEntity,
    ReminderPolicyEntity,
    ReminderEntity,
    RetryAuditLogEntity,
    PaymentAuditLogEntity,
    PaymentStatusEntity,
    RejectionReasonEntity,
    ProviderRoutingRuleEntity,
    ProviderOverrideEntity,
    ProviderReassignmentJobEntity,
    ExportJobEntity,
    RiskScoreEntity,
    DunningConfigEntity,
    ProviderStatusMappingEntity,
    CustomerInteractionEntity,
    ReconciliationEntity,
    PaymentArchiveEntity,
    // Calendar
    SystemDebitConfigurationEntity,
    CutoffConfigurationEntity,
    CompanyDebitConfigurationEntity,
    ClientDebitConfigurationEntity,
    ContractDebitConfigurationEntity,
    HolidayZoneEntity,
    HolidayEntity,
    PlannedDebitEntity,
    VolumeForecastEntity,
    VolumeThresholdEntity,
    CalendarAuditLogEntity,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // TOUJOURS false - on utilise les migrations
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

// DataSource pour la CLI TypeORM
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
