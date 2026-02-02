import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { NatsModule, ProcessedEvent } from '@crm/nats-utils';
import { AuthInterceptor } from '@crm/grpc-utils';
import { PieceJointeModule } from './modules/piece-jointe/piece-jointe.module';
import { BoiteMailModule } from './modules/boite-mail/boite-mail.module';
import { EventsModule } from './modules/events/events.module';
import { PieceJointe } from './modules/piece-jointe/entities/piece-jointe.entity';
import { BoiteMail } from './modules/boite-mail/entities/boite-mail.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'documents_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [PieceJointe, BoiteMail, ProcessedEvent],
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),
    PieceJointeModule,
    BoiteMailModule,
    EventsModule,
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
