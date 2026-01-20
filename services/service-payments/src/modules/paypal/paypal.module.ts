import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaypalAccountEntity } from './entities/paypal-account.entity.js';
import { PaypalService } from './paypal.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PaypalAccountEntity])],
  providers: [PaypalService],
  exports: [PaypalService],
})
export class PaypalModule {}
