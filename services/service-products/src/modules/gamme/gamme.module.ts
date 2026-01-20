import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GammeEntity } from './entities/gamme.entity';
import { GammeService } from './gamme.service';

@Module({
  imports: [TypeOrmModule.forFeature([GammeEntity])],
  providers: [GammeService],
  exports: [GammeService],
})
export class GammeModule {}
