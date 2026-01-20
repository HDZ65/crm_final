import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpeditionEntity } from './entities/expedition.entity.js';
import { ExpeditionService } from './expedition.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExpeditionEntity])],
  providers: [ExpeditionService],
  exports: [ExpeditionService],
})
export class ExpeditionModule {}
