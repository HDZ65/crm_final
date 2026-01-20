import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneFactureEntity } from './entities/ligne-facture.entity';
import { LigneFactureService } from './ligne-facture.service';

@Module({
  imports: [TypeOrmModule.forFeature([LigneFactureEntity])],
  providers: [LigneFactureService],
  exports: [LigneFactureService],
})
export class LigneFactureModule {}
