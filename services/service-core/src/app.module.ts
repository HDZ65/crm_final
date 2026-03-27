import { GrpcAppModule, NatsModule } from '@crm/shared-kernel';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ClientsModule } from './clients.module';
import { DashboardModule } from './dashboard.module';
import { DepanssurModule } from './depanssur.module';
import { DocumentsModule } from './documents.module';
import { AuditSubscriber } from './infrastructure/persistence/typeorm/audit-subscriber';
// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { OrganisationsModule } from './organisations.module';

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
        queue: 'service-core',
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
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        migrationsRun: configService.get('MIGRATIONS_RUN', 'true') === 'true',
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
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
    // gRPC interceptors and exception filter
    GrpcAppModule.forRoot(),
    // DDD Bounded Context Modules
    OrganisationsModule,
    ClientsModule,
    DocumentsModule,
    DashboardModule,
    DepanssurModule,
  ],
  controllers: [],
  providers: [AuditSubscriber],
})
export class AppModule {}
