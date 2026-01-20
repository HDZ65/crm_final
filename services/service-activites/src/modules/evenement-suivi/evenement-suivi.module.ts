import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvenementSuivi } from './entities/evenement-suivi.entity';
import { EvenementSuiviService } from './evenement-suivi.service';

@Module({
  imports: [TypeOrmModule.forFeature([EvenementSuivi])],
  providers: [EvenementSuiviService],
  exports: [EvenementSuiviService],
})
export class EvenementSuiviModule {}
