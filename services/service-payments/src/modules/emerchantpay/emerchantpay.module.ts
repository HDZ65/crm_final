import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmerchantpayAccountEntity } from './entities/emerchantpay-account.entity';
import { EmerchantpayService } from './emerchantpay.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmerchantpayAccountEntity])],
  providers: [EmerchantpayService],
  exports: [EmerchantpayService],
})
export class EmerchantpayModule {}
