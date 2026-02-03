import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriqueRelanceEntity } from './entities/historique-relance.entity';
import { HistoriqueRelanceService } from './historique-relance.service';
import { HistoriqueRelanceController } from './historique-relance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriqueRelanceEntity])],
  controllers: [HistoriqueRelanceController],
  providers: [HistoriqueRelanceService],
  exports: [HistoriqueRelanceService],
})
export class HistoriqueRelanceModule {}
