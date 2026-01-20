import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { StatutClientModule } from './modules/statut-client/statut-client.module';
import { AdresseModule } from './modules/adresse/adresse.module';
import { ClientBaseModule } from './modules/client-base/client-base.module';
import { ClientEntrepriseModule } from './modules/client-entreprise/client-entreprise.module';
import { ClientPartenaireModule } from './modules/client-partenaire/client-partenaire.module';
import { ClientsController } from './clients.controller';

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
        database: configService.get('DB_DATABASE', 'clients_db'),
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
    StatutClientModule,
    AdresseModule,
    ClientBaseModule,
    ClientEntrepriseModule,
    ClientPartenaireModule,
  ],
  controllers: [ClientsController],
})
export class AppModule {}
