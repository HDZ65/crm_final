import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionEntity } from './entities/commission.entity';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionEntity])],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
