import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlimpayAccountEntity } from './entities/slimpay-account.entity';
import { SlimpayService } from './slimpay.service';

@Module({
  imports: [TypeOrmModule.forFeature([SlimpayAccountEntity])],
  providers: [SlimpayService],
  exports: [SlimpayService],
})
export class SlimpayModule {}
