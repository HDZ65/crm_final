import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor, NatsModule, GrpcExceptionFilter } from '@crm/shared-kernel';
import { AuditSubscriber } from './infrastructure/persistence/typeorm/audit-subscriber';

// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { UsersModule } from './users.module';
import { OrganisationsModule } from './organisations.module';
import { ClientsModule } from './clients.module';
import { DocumentsModule } from './documents.module';
import { DashboardModule } from './dashboard.module';
import { DepanssurModule } from './depanssur.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NatsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.get('NATS_URL', 'nats://localhost:4222'),
        name: 'service-core',
      }),
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
        synchronize: configService.get('NODE_ENV') !== 'production',
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
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
    // DDD Bounded Context Modules
    UsersModule,
    OrganisationsModule,
    ClientsModule,
    DocumentsModule,
    DashboardModule,
    DepanssurModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
    AuditSubscriber,
  ],
})
export class AppModule {}
