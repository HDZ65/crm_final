import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembreCompteEntity } from './entities/membre-compte.entity';
import { MembreCompteService } from './membre-compte.service';
import { MembreCompteController } from './membre-compte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MembreCompteEntity])],
  controllers: [MembreCompteController],
  providers: [MembreCompteService],
  exports: [MembreCompteService],
})
export class MembreCompteModule {}
