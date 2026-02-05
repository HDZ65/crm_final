import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvenementSuivi } from './entities/evenement-suivi.entity';
import { EvenementSuiviService } from './evenement-suivi.service';
import { EvenementSuiviController } from './evenement-suivi.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EvenementSuivi])],
  controllers: [EvenementSuiviController],
  providers: [EvenementSuiviService],
  exports: [EvenementSuiviService],
})
export class EvenementSuiviModule {}
