import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompteEntity } from './entities/compte.entity';
import { CompteService } from './compte.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompteEntity])],
  providers: [CompteService],
  exports: [CompteService],
})
export class CompteModule {}
