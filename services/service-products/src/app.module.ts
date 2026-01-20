import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { GammeModule } from './modules/gamme/gamme.module';
import { ProduitModule } from './modules/produit/produit.module';
import { GrilleTarifaireModule } from './modules/grille-tarifaire/grille-tarifaire.module';
import { PrixProduitModule } from './modules/prix-produit/prix-produit.module';
import { CatalogModule } from './modules/catalog/catalog.module';

import { ProductsController } from './products.controller';

import { GammeEntity } from './modules/gamme/entities/gamme.entity';
import { ProduitEntity } from './modules/produit/entities/produit.entity';
import { GrilleTarifaireEntity } from './modules/grille-tarifaire/entities/grille-tarifaire.entity';
import { PrixProduitEntity } from './modules/prix-produit/entities/prix-produit.entity';

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
        database: configService.get<string>('DB_DATABASE', 'products_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [GammeEntity, ProduitEntity, GrilleTarifaireEntity, PrixProduitEntity],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? {
                rejectUnauthorized: configService.get<string>('NODE_ENV') === 'production',
              }
            : false,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    GammeModule,
    ProduitModule,
    GrilleTarifaireModule,
    PrixProduitModule,
    CatalogModule,
  ],
  controllers: [ProductsController],
})
export class AppModule {}
