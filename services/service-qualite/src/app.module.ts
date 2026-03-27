import { GrpcAppModule, NatsModule } from '@crm/shared-kernel';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { QualiteModule } from './qualite.module';

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
        database: configService.get<string>('DB_DATABASE', 'qualite_db'),
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
      }),
    }),

    NatsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.get<string>('NATS_URL', 'nats://localhost:4222'),
        queue: 'service-qualite',
      }),
    }),

    GrpcAppModule.forRoot(),

    QualiteModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
