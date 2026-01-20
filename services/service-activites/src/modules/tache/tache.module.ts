import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tache } from './entities/tache.entity';
import { TacheService } from './tache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tache])],
  providers: [TacheService],
  exports: [TacheService],
})
export class TacheModule {}
