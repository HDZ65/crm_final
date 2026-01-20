import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlimpayAccountEntity } from './entities/slimpay-account.entity.js';
import { SlimpayService } from './slimpay.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SlimpayAccountEntity])],
  providers: [SlimpayService],
  exports: [SlimpayService],
})
export class SlimpayModule {}
