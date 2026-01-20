import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarrierAccountEntity } from './entities/carrier-account.entity.js';
import { CarrierService } from './carrier.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([CarrierAccountEntity])],
  providers: [CarrierService],
  exports: [CarrierService],
})
export class CarrierModule {}
