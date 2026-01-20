import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apporteur } from './entities/apporteur.entity';
import { ApporteurService } from './apporteur.service';

@Module({
  imports: [TypeOrmModule.forFeature([Apporteur])],
  providers: [ApporteurService],
  exports: [ApporteurService],
})
export class ApporteurModule {}
