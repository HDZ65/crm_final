import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BordereauCommissionEntity } from './entities/bordereau-commission.entity';
import { BordereauService } from './bordereau.service';
import { BordereauController } from './bordereau.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BordereauCommissionEntity])],
  controllers: [BordereauController],
  providers: [BordereauService],
  exports: [BordereauService],
})
export class BordereauModule {}
