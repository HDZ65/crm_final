import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturationParEntity } from './entities/facturation-par.entity';
import { FacturationParService } from './facturation-par.service';
import { FacturationParController } from './facturation-par.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FacturationParEntity])],
  controllers: [FacturationParController],
  providers: [FacturationParService],
  exports: [FacturationParService],
})
export class FacturationParModule {}
