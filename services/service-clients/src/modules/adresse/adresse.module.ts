import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdresseEntity } from './entities/adresse.entity';
import { AdresseService } from './adresse.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdresseEntity])],
  providers: [AdresseService],
  exports: [AdresseService],
})
export class AdresseModule {}
