import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutCommissionEntity } from './entities/statut-commission.entity';
import { StatutService } from './statut.service';

@Module({
  imports: [TypeOrmModule.forFeature([StatutCommissionEntity])],
  providers: [StatutService],
  exports: [StatutService],
})
export class StatutModule {}
