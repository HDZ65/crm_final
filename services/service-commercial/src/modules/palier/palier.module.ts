import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PalierCommissionEntity } from './entities/palier-commission.entity';
import { PalierService } from './palier.service';
import { PalierController } from './palier.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PalierCommissionEntity])],
  controllers: [PalierController],
  providers: [PalierService],
  exports: [PalierService],
})
export class PalierModule {}
