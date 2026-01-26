import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { OrganisationModule } from './modules/organisation/organisation.module';
import { SocieteModule } from './modules/societe/societe.module';
import { StatutPartenaireModule } from './modules/statut-partenaire/statut-partenaire.module';
import { PartenaireMarqueBlancheModule } from './modules/partenaire-marque-blanche/partenaire-marque-blanche.module';
import { ThemeMarqueModule } from './modules/theme-marque/theme-marque.module';
import { RolePartenaireModule } from './modules/role-partenaire/role-partenaire.module';
import { MembrePartenaireModule } from './modules/membre-partenaire/membre-partenaire.module';
import { InvitationCompteModule } from './modules/invitation-compte/invitation-compte.module';
import { UsersClientModule } from './grpc-clients/users-client.module';
import { OrganisationsController } from './organisations.controller';

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
        database: configService.get('DB_DATABASE', 'organisations_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    OrganisationModule,
    SocieteModule,
    StatutPartenaireModule,
    PartenaireMarqueBlancheModule,
    ThemeMarqueModule,
    RolePartenaireModule,
    MembrePartenaireModule,
    InvitationCompteModule,
    UsersClientModule,
  ],
  controllers: [OrganisationsController],
})
export class AppModule {}
