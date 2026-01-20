import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeAccountEntity } from './entities/stripe-account.entity.js';
import { StripeService } from './stripe.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([StripeAccountEntity])],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
