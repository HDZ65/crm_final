import { Module } from '@nestjs/common';
import { PspAccountsController } from './psp-accounts.controller';
import { StripeModule } from '../stripe/stripe.module';
import { PaypalModule } from '../paypal/paypal.module';
import { GoCardlessModule } from '../gocardless/gocardless.module';
import { SlimpayModule } from '../slimpay/slimpay.module';
import { MultiSafepayModule } from '../multisafepay/multisafepay.module';
import { EmerchantpayModule } from '../emerchantpay/emerchantpay.module';

@Module({
  imports: [
    StripeModule,
    PaypalModule,
    GoCardlessModule,
    SlimpayModule,
    MultiSafepayModule,
    EmerchantpayModule,
  ],
  controllers: [PspAccountsController],
})
export class PspAccountsModule {}
