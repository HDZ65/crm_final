import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BordereauCommissionEntity } from './entities/bordereau-commission.entity';
import { BordereauService } from './bordereau.service';

@Module({
  imports: [TypeOrmModule.forFeature([BordereauCommissionEntity])],
  providers: [BordereauService],
  exports: [BordereauService],
})
export class BordereauModule {}
