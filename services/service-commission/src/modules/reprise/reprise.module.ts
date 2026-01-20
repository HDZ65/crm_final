import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepriseCommissionEntity } from './entities/reprise-commission.entity';
import { RepriseService } from './reprise.service';

@Module({
  imports: [TypeOrmModule.forFeature([RepriseCommissionEntity])],
  providers: [RepriseService],
  exports: [RepriseService],
})
export class RepriseModule {}
