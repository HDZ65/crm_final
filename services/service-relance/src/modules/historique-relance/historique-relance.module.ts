import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriqueRelanceEntity } from './entities/historique-relance.entity';
import { HistoriqueRelanceService } from './historique-relance.service';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriqueRelanceEntity])],
  providers: [HistoriqueRelanceService],
  exports: [HistoriqueRelanceService],
})
export class HistoriqueRelanceModule {}
