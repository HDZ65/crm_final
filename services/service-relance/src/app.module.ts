@nestjs/core';
import { NatsModule } from '@crm/nats-utils';
import { AuthInterceptor } from '@crm/grpc-utils';

import { Module } from '@nestjs/common';;
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { RegleRelanceModule } from './modules/regle-relance/regle-relance.module';
import { HistoriqueRelanceModule } from './modules/historique-relance/historique-relance.module';
import { EngineModule } from './modules/engine/engine.module';

import { RegleRelanceEntity } from './modules/regle-relance/entities/regle-relance.entity';
import { HistoriqueRelanceEntity } from './modules/historique-relance/entities/historique-relance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'relance_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [RegleRelanceEntity, HistoriqueRelanceEntity],
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? {
                rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production',
              }
            : false,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    RegleRelanceModule,
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),
    HistoriqueRelanceModule,
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),
    EngineModule,
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),
  ],
  controllers: [],
})
export class AppModule {}
