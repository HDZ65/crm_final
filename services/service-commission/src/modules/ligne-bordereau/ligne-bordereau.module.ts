import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneBordereauEntity } from './entities/ligne-bordereau.entity';
import { LigneBordereauService } from './ligne-bordereau.service';
import { LigneBordereauController } from './ligne-bordereau.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LigneBordereauEntity])],
  controllers: [LigneBordereauController],
  providers: [LigneBordereauService],
  exports: [LigneBordereauService],
})
export class LigneBordereauModule {}
