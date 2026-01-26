import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeAccountEntity } from './entities/stripe-account.entity';
import { StripeService } from './stripe.service';

@Module({
  imports: [TypeOrmModule.forFeature([StripeAccountEntity])],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
