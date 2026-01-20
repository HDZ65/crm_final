import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

// Core Modules
import { KeycloakModule } from './keycloak.module';
import { SecurityModule } from './security.module';

// Database Configuration
import { databaseConfig } from '../../db/database.config';
import { DatabaseService } from '../../db/database.service';

// App Controller
import { AppController } from './http/app.controller';

// Feature Modules - Domain-based organization
import { ClientModule } from './client';
import { ContratModule } from './contrat';
import { FactureModule } from './facture';
import { CommissionModule } from './commission';
import { PartenaireModule } from './partenaire';
import { UtilisateurModule } from './utilisateur';
import { OrganisationModule } from './organisation';
import { SocieteModule, FactureSettingsModule } from './groupe';
import { LogistiqueModule } from './logistique';
import { ActiviteModule } from './activite';
import { ProduitModule } from './produit';
import { NotificationModule } from './notification';
import { DashboardModule } from './dashboard';
import { PaymentModule } from './payment';
import { RelanceModule } from './relance';
import { EmailModule } from './email';
import { AiModule } from './ai';
import { CommonModule } from './common';
import { GoCardlessModule } from './gocardless';
import { InvoiceServiceModule } from './invoice-service/invoice-service.module';
import { PaymentGrpcModule } from '../../grpc/payments';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Rate Limiting (global configuration)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 second
        limit: 3,    // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,  // 10 seconds
        limit: 20,   // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,  // 1 minute
        limit: 100,  // 100 requests per minute
      },
    ]),

    // Security
    KeycloakModule,
    SecurityModule,

    // Database
    ...(process.env.DB_TYPE === 'postgres' || !process.env.DB_TYPE
      ? [TypeOrmModule.forRoot(databaseConfig)]
      : []),

    // Feature Modules
    ClientModule,
    ContratModule,
    FactureModule,
    CommissionModule,
    PartenaireModule,
    UtilisateurModule,
    OrganisationModule,
    SocieteModule,
    FactureSettingsModule,
    LogistiqueModule,
    ActiviteModule,
    ProduitModule,
    NotificationModule,
    DashboardModule,
    PaymentModule,
    RelanceModule,
    EmailModule,
    AiModule,
    CommonModule,
    GoCardlessModule,
    InvoiceServiceModule,
    PaymentGrpcModule,
  ],
  controllers: [AppController],
  providers: [DatabaseService],
})
export class AppModule {}
