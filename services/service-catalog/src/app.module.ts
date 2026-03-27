import { GrpcAppModule, NatsModule } from '@crm/shared-kernel';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
// ============================================================================
// DDD BOUNDED CONTEXT MODULES
// ============================================================================
import { ProductsModule } from './products.module';
import { SubscriptionsModule } from './subscriptions.module';

@Module({
  imports: [
    // ========================================================================
    // CORE INFRASTRUCTURE
    // ========================================================================
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
        database: configService.get<string>('DB_DATABASE', 'catalog_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        migrationsRun: configService.get('MIGRATIONS_RUN', 'false') === 'true',
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production' }
            : false,
        extra: {
          max: 15,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),

    NatsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.get<string>('NATS_URL', 'nats://localhost:4222'),
        queue: 'service-catalog',
      }),
    }),

    // gRPC interceptors and exception filter
    GrpcAppModule.forRoot(),

    // ========================================================================
    // DDD BOUNDED CONTEXT MODULES
    // ========================================================================
    ProductsModule,
    SubscriptionsModule,
  ],

  controllers: [],

  providers: [],
})
export class AppModule {}
