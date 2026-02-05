import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneFactureEntity } from './entities/ligne-facture.entity';
import { LigneFactureService } from './ligne-facture.service';
import { LigneFactureController } from './ligne-facture.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LigneFactureEntity])],
  controllers: [LigneFactureController],
  providers: [LigneFactureService],
  exports: [LigneFactureService],
})
export class LigneFactureModule {}
