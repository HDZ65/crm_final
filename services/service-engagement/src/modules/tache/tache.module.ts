import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tache } from './entities/tache.entity';
import { TacheService } from './tache.service';
import { TacheController } from './tache.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tache])],
  controllers: [TacheController],
  providers: [TacheService],
  exports: [TacheService],
})
export class TacheModule {}
