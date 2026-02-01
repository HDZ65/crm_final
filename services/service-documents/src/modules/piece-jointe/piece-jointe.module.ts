import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PieceJointe } from './entities/piece-jointe.entity';
import { PieceJointeService } from './piece-jointe.service';
import { PieceJointeController } from './piece-jointe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PieceJointe])],
  controllers: [PieceJointeController],
  providers: [PieceJointeService],
  exports: [PieceJointeService],
})
export class PieceJointeModule {}
