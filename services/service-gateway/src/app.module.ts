import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';

// ============================================================================
// DOMAIN MODULES
// ============================================================================
import { LogisticsModule } from './logistics/logistics.module';
import { ActivitesModule } from './activites/activites.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WincashModule } from './wincash/wincash.module';
import { ClientsModule } from './clients/clients.module';
import { UsersModule } from './users/users.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { DepanssurModule } from './depanssur/depanssur.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { CommerciauxModule } from './commerciaux/commerciaux.module';
import { CfastModule } from './cfast/cfast.module';
import { ProductsModule } from './products/products.module';
import { CommissionModule } from './commission/commission.module';
import { BundleModule } from './bundle/bundle.module';
import { ContratsModule } from './contrats/contrats.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WoocommerceModule } from './woocommerce/woocommerce.module';
import { PaymentsModule } from './payments/payments.module';
import { FacturesModule } from './factures/factures.module';
import { ContratModule } from './contrat/contrat.module';
import { ScoringModule } from './scoring/scoring.module';
import { HealthModule } from './health/health.module';
import { YousignModule } from './yousign/yousign.module';
import { QualiteModule } from './qualite/qualite.module';

import { NatsPublisherModule } from './nats/nats-publisher.module';
import { GrpcClientModule } from './grpc/grpc-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.development', '.env'],
    }),
    CommonModule,
    AuthModule,
    ContratModule,
    ScoringModule,
    HealthModule,

    NatsPublisherModule,
    GrpcClientModule,
    // Domain modules
    LogisticsModule,
    ActivitesModule,
    NotificationsModule,
    WincashModule,
    ClientsModule,
    UsersModule,
    OrganisationsModule,
    DepanssurModule,
    DashboardModule,
    DocumentsModule,
    CommerciauxModule,
    CfastModule,
    ProductsModule,
    CommissionModule,
    ScoringModule,

    BundleModule,
    ContratsModule,
    SubscriptionsModule,
    WoocommerceModule,
    PaymentsModule,
    FacturesModule,
    YousignModule,
    QualiteModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
