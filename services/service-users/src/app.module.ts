import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { UtilisateurModule } from './modules/utilisateur/utilisateur.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RolePermissionModule } from './modules/role-permission/role-permission.module';
import { CompteModule } from './modules/compte/compte.module';
import { MembreCompteModule } from './modules/membre-compte/membre-compte.module';
import { InvitationCompteModule } from './modules/invitation-compte/invitation-compte.module';
import { AuthSyncModule } from './modules/auth-sync/auth-sync.module';
import { UsersController } from './users.controller';

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
        database: configService.get('DB_DATABASE', 'users_db'),
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV', 'development') === 'development',
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
  ],
  controllers: [UsersController],
})
export class AppModule {}
