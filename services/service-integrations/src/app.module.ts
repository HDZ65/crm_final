import { GrpcAppModule, NatsModule } from '@crm/shared-kernel';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
// ============================================================================
// INTEGRATION MODULES
// ============================================================================
import { WooCommerceModule } from './woocommerce.module';
import { WinLeadPlusModule } from './winleadplus.module';
import { CfastModule } from './cfast.module';
import { MondialTvModule } from './mondial-tv.module';
import { ReducBoxModule } from './reducbox.module';

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
        database: configService.get<string>('DB_DATABASE', 'integrations_db'),
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
          max: 10,
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
        queue: 'service-integrations',
      }),
    }),

    // gRPC interceptors and exception filter
    GrpcAppModule.forRoot(),

    // ========================================================================
    // INTEGRATION MODULES
    // ========================================================================
    WooCommerceModule,
    WinLeadPlusModule,
    CfastModule,
    MondialTvModule,
    ReducBoxModule,
  ],

  controllers: [],

  providers: [],
})
export class AppModule {}
