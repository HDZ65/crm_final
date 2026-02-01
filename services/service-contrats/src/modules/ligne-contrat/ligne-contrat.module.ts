import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneContratEntity } from './entities/ligne-contrat.entity';
import { LigneContratService } from './ligne-contrat.service';
import { LigneContratController } from './ligne-contrat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LigneContratEntity])],
  controllers: [LigneContratController],
  providers: [LigneContratService],
  exports: [LigneContratService],
})
export class LigneContratModule {}
