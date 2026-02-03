import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatutCommissionEntity } from './entities/statut-commission.entity';
import { StatutService } from './statut.service';
import { StatutController } from './statut.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatutCommissionEntity])],
  controllers: [StatutController],
  providers: [StatutService],
  exports: [StatutService],
})
export class StatutModule {}
