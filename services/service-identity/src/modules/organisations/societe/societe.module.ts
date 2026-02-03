import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocieteEntity } from './entities/societe.entity';
import { SocieteService } from './societe.service';
import { SocieteController } from './societe.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocieteEntity])],
  controllers: [SocieteController],
  providers: [SocieteService],
  exports: [SocieteService],
})
export class SocieteModule {}
