import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apporteur } from './entities/apporteur.entity';
import { ApporteurService } from './apporteur.service';
import { ApporteurController } from './apporteur.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Apporteur])],
  controllers: [ApporteurController],
  providers: [ApporteurService],
  exports: [ApporteurService],
})
export class ApporteurModule {}
