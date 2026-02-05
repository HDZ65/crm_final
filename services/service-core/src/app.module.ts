import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';
import { NatsModule } from '@crm/nats-utils';

// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { UsersModule } from './users.module';
import { OrganisationsModule } from './organisations.module';
import { ClientsModule } from './clients.module';
import { DocumentsModule } from './documents.module';

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
        database: configService.get('DB_DATABASE', 'core_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    NatsModule.forRoot({ servers: process.env.NATS_URL || 'nats://localhost:4222' }),

    // DDD Bounded Context Modules
    UsersModule,
    OrganisationsModule,
    ClientsModule,
    DocumentsModule,
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
