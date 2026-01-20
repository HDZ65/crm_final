import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneBordereauEntity } from './entities/ligne-bordereau.entity';
import { LigneBordereauService } from './ligne-bordereau.service';

@Module({
  imports: [TypeOrmModule.forFeature([LigneBordereauEntity])],
  providers: [LigneBordereauService],
  exports: [LigneBordereauService],
})
export class LigneBordereauModule {}
