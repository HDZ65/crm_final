import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Feature Modules
import { ExpeditionModule } from './modules/expedition/expedition.module.js';
import { ColisModule } from './modules/colis/colis.module.js';
import { TrackingModule } from './modules/tracking/tracking.module.js';
import { CarrierModule } from './modules/carrier/carrier.module.js';
import { MailevaModule } from './modules/maileva/maileva.module.js';

// Entities
import { ExpeditionEntity } from './modules/expedition/entities/expedition.entity.js';
import { ColisEntity } from './modules/colis/entities/colis.entity.js';
import { TrackingEventEntity } from './modules/tracking/entities/tracking-event.entity.js';
import { CarrierAccountEntity } from './modules/carrier/entities/carrier-account.entity.js';

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
        database: configService.get('DB_DATABASE', 'logistics_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [
          ExpeditionEntity,
          ColisEntity,
          TrackingEventEntity,
          CarrierAccountEntity,
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
    ExpeditionModule,
    ColisModule,
    TrackingModule,
    CarrierModule,
    MailevaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
