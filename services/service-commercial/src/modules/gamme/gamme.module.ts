import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GammeEntity } from './entities/gamme.entity';
import { GammeService } from './gamme.service';
import { GammeController } from './gamme.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GammeEntity])],
  controllers: [GammeController],
  providers: [GammeService],
  exports: [GammeService],
})
export class GammeModule {}
