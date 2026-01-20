import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MultiSafepayAccountEntity } from './entities/multisafepay-account.entity.js';
import { MultiSafepayService } from './multisafepay.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([MultiSafepayAccountEntity])],
  providers: [MultiSafepayService],
  exports: [MultiSafepayService],
})
export class MultiSafepayModule {}
