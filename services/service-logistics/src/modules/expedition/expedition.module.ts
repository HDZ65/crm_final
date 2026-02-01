import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpeditionEntity } from './entities/expedition.entity.js';
import { ExpeditionService } from './expedition.service.js';
import { ExpeditionController } from './expedition.controller.js';
import { MailevaModule } from '../maileva/maileva.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExpeditionEntity]), MailevaModule],
  controllers: [ExpeditionController],
  providers: [ExpeditionService],
  exports: [ExpeditionService],
})
export class ExpeditionModule {}
