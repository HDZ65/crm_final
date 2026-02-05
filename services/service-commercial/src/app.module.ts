import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { NatsModule } from '@crm/nats-utils';
import { AuthInterceptor } from '@crm/grpc-utils';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// =============================================================================
// EXISTING COMMERCIAL MODULES (14)
// =============================================================================
import { CommissionModule } from './modules/commission/commission.module';
import { BaremeModule } from './modules/bareme/bareme.module';
import { PalierModule } from './modules/palier/palier.module';
import { BordereauModule } from './modules/bordereau/bordereau.module';
import { LigneBordereauModule } from './modules/ligne-bordereau/ligne-bordereau.module';
import { RepriseModule } from './modules/reprise/reprise.module';
import { StatutModule } from './modules/statut/statut.module';
import { EngineModule } from './modules/engine/engine.module';
import { CommissionAuditModule } from './modules/audit/audit.module';
import { RecurrenceModule } from './modules/recurrence/recurrence.module';
import { ReportNegatifModule } from './modules/report/report.module';
import { EventsModule } from './modules/events/events.module';
import { ApporteurModule } from './modules/apporteur/apporteur.module';
import { ModeleDistributionModule } from './modules/modele-distribution/modele-distribution.module';

// =============================================================================
// FROM SERVICE-CONTRATS (5)
// =============================================================================
import { ContratModule } from './modules/contrat/contrat.module';
import { LigneContratModule } from './modules/ligne-contrat/ligne-contrat.module';
import { StatutContratModule } from './modules/statut-contrat/statut-contrat.module';
import { HistoriqueStatutContratModule } from './modules/historique-statut-contrat/historique-statut-contrat.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';

// =============================================================================
// FROM SERVICE-PRODUCTS (8)
// =============================================================================
import { GammeModule } from './modules/gamme/gamme.module';
import { ProduitModule } from './modules/produit/produit.module';
import { GrilleTarifaireModule } from './modules/grille-tarifaire/grille-tarifaire.module';
import { PrixProduitModule } from './modules/prix-produit/prix-produit.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { VersionProduitModule } from './modules/version-produit/version-produit.module';
import { DocumentProduitModule } from './modules/document-produit/document-produit.module';
import { PublicationProduitModule } from './modules/publication-produit/publication-produit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'commercial_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true, // Auto-load all entities from TypeOrmModule.forFeature()
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production' }
            : false,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),

    // =========================================================================
    // EXISTING COMMERCIAL MODULES (14)
    // =========================================================================
    CommissionModule,
    BaremeModule,
    PalierModule,
    BordereauModule,
    LigneBordereauModule,
    RepriseModule,
    StatutModule,
    EngineModule,
    CommissionAuditModule,
    RecurrenceModule,
    ReportNegatifModule,
    EventsModule,
    ApporteurModule,
    ModeleDistributionModule,

    // =========================================================================
    // FROM SERVICE-CONTRATS (5)
    // =========================================================================
    ContratModule,
    LigneContratModule,
    StatutContratModule,
    HistoriqueStatutContratModule,
    OrchestrationModule,

    // =========================================================================
    // FROM SERVICE-PRODUCTS (8)
    // =========================================================================
    GammeModule,
    ProduitModule,
    GrilleTarifaireModule,
    PrixProduitModule,
    CatalogModule,
    VersionProduitModule,
    DocumentProduitModule,
    PublicationProduitModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
