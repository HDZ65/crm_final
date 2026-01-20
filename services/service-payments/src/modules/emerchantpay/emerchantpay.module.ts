import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmerchantpayAccountEntity } from './entities/emerchantpay-account.entity.js';
import { EmerchantpayService } from './emerchantpay.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EmerchantpayAccountEntity])],
  providers: [EmerchantpayService],
  exports: [EmerchantpayService],
})
export class EmerchantpayModule {}
