import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocieteEntity } from './entities/societe.entity';
import { SocieteService } from './societe.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocieteEntity])],
  providers: [SocieteService],
  exports: [SocieteService],
})
export class SocieteModule {}
