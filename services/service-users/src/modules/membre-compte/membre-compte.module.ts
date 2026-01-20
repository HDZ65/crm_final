import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembreCompteEntity } from './entities/membre-compte.entity';
import { MembreCompteService } from './membre-compte.service';

@Module({
  imports: [TypeOrmModule.forFeature([MembreCompteEntity])],
  providers: [MembreCompteService],
  exports: [MembreCompteService],
})
export class MembreCompteModule {}
