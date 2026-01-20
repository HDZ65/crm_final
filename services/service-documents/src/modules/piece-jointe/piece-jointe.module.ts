import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PieceJointe } from './entities/piece-jointe.entity';
import { PieceJointeService } from './piece-jointe.service';

@Module({
  imports: [TypeOrmModule.forFeature([PieceJointe])],
  providers: [PieceJointeService],
  exports: [PieceJointeService],
})
export class PieceJointeModule {}
