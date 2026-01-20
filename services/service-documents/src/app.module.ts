import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PieceJointeModule } from './modules/piece-jointe/piece-jointe.module';
import { BoiteMailModule } from './modules/boite-mail/boite-mail.module';
import { DocumentsController } from './documents.controller';
import { PieceJointe } from './modules/piece-jointe/entities/piece-jointe.entity';
import { BoiteMail } from './modules/boite-mail/entities/boite-mail.entity';

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
        database: configService.get('DB_DATABASE', 'documents_db'),
        namingStrategy: new SnakeNamingStrategy(),
        entities: [PieceJointe, BoiteMail],
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
      inject: [ConfigService],
    }),
    PieceJointeModule,
    BoiteMailModule,
  ],
  controllers: [DocumentsController],
})
export class AppModule {}
