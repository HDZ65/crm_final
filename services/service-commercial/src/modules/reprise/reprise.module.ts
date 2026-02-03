import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepriseCommissionEntity } from './entities/reprise-commission.entity';
import { RepriseService } from './reprise.service';
import { RepriseController } from './reprise.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RepriseCommissionEntity])],
  controllers: [RepriseController],
  providers: [RepriseService],
  exports: [RepriseService],
})
export class RepriseModule {}
