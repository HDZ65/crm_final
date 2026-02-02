@nestjs/core';
import { AuthInterceptor } from '@crm/grpc-utils';

import { Module } from '@nestjs/common';;
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { TypeActiviteModule } from './modules/type-activite/type-activite.module';
import { ActiviteModule } from './modules/activite/activite.module';
import { TacheModule } from './modules/tache/tache.module';
import { EvenementSuiviModule } from './modules/evenement-suivi/evenement-suivi.module';
import { TypeActivite } from './modules/type-activite/entities/type-activite.entity';
import { Activite } from './modules/activite/entities/activite.entity';
import { Tache } from './modules/tache/entities/tache.entity';
import { EvenementSuivi } from './modules/evenement-suivi/entities/evenement-suivi.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'activites_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [TypeActivite, Activite, Tache, EvenementSuivi],
        synchronize: false, // Désactivé - utiliser les migrations
        migrationsRun: true, // Exécute les migrations au démarrage
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
    TypeActiviteModule,
    ActiviteModule,
    TacheModule,
    EvenementSuiviModule,
  ],
  controllers: [],
})
export class AppModule {}
