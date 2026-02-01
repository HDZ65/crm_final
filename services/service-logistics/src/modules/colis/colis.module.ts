import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColisEntity } from './entities/colis.entity.js';
import { ColisService } from './colis.service.js';
import { ColisController } from './colis.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ColisEntity])],
  controllers: [ColisController],
  providers: [ColisService],
  exports: [ColisService],
})
export class ColisModule {}
