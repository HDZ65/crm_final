import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { StatutContratModule } from './modules/statut-contrat/statut-contrat.module';
import { ContratModule } from './modules/contrat/contrat.module';
import { LigneContratModule } from './modules/ligne-contrat/ligne-contrat.module';
import { HistoriqueStatutContratModule } from './modules/historique-statut-contrat/historique-statut-contrat.module';
import { OrchestrationModule } from './modules/orchestration/orchestration.module';
import { ContratsController } from './contrats.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
        database: configService.get('DB_DATABASE', 'contrats_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') === 'development',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    StatutContratModule,
    ContratModule,
    LigneContratModule,
    HistoriqueStatutContratModule,
    OrchestrationModule,
  ],
  controllers: [ContratsController],
})
export class AppModule {}
