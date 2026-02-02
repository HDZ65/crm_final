import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule } from '@crm/nats-utils';
import { ProcessedEvent } from '@crm/nats-utils';
import { MailboxModule } from './modules/mailbox/mailbox.module';
import { GoogleOAuthModule } from './modules/oauth/google/google-oauth.module';
import { MicrosoftOAuthModule } from './modules/oauth/microsoft/microsoft-oauth.module';
import { OperationsModule } from './modules/operations/operations.module';
import { EventsModule } from './modules/events/events.module';
import { MailboxEntity } from './modules/mailbox/entities/mailbox.entity';
import { EncryptionService } from './common/encryption.service';

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
        database: configService.get<string>('DB_DATABASE', 'email_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [MailboxEntity, ProcessedEvent],
        synchronize: false,
        migrationsRun: true,
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
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),
    MailboxModule,
    GoogleOAuthModule,
    MicrosoftOAuthModule,
    OperationsModule,
    EventsModule,
  ],
  controllers: [],
  providers: [
    EncryptionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
