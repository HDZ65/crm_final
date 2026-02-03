import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthInterceptor } from '@crm/grpc-utils';

import { UtilisateurModule } from './modules/users/utilisateur/utilisateur.module';
import { RoleModule } from './modules/users/role/role.module';
import { PermissionModule } from './modules/users/permission/permission.module';
import { RolePermissionModule } from './modules/users/role-permission/role-permission.module';
import { CompteModule } from './modules/users/compte/compte.module';
import { MembreCompteModule } from './modules/users/membre-compte/membre-compte.module';
import { InvitationCompteModule } from './modules/users/invitation-compte/invitation-compte.module';
import { AuthSyncModule } from './modules/users/auth-sync/auth-sync.module';

import { OrganisationModule } from './modules/organisations/organisation/organisation.module';
import { SocieteModule } from './modules/organisations/societe/societe.module';
import { StatutPartenaireModule } from './modules/organisations/statut-partenaire/statut-partenaire.module';
import { PartenaireMarqueBlancheModule } from './modules/organisations/partenaire-marque-blanche/partenaire-marque-blanche.module';
import { ThemeMarqueModule } from './modules/organisations/theme-marque/theme-marque.module';
import { RolePartenaireModule } from './modules/organisations/role-partenaire/role-partenaire.module';
import { MembrePartenaireModule } from './modules/organisations/membre-partenaire/membre-partenaire.module';

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
        database: configService.get('DB_DATABASE', 'identity_db'),
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
    UtilisateurModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    CompteModule,
    MembreCompteModule,
    InvitationCompteModule,
    AuthSyncModule,
    OrganisationModule,
    SocieteModule,
    StatutPartenaireModule,
    PartenaireMarqueBlancheModule,
    ThemeMarqueModule,
    RolePartenaireModule,
    MembrePartenaireModule,
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
