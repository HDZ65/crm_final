import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionEntity } from './entities/commission.entity';
import { CommissionService } from './commission.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionEntity])],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
