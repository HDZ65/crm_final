import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaypalAccountEntity } from './entities/paypal-account.entity';
import { PaypalService } from './paypal.service';
import { PaypalController } from './paypal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaypalAccountEntity])],
  controllers: [PaypalController],
  providers: [PaypalService],
  exports: [PaypalService],
})
export class PaypalModule {}
