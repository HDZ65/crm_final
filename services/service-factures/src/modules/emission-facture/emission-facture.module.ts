import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmissionFactureEntity } from './entities/emission-facture.entity';
import { EmissionFactureService } from './emission-facture.service';
import { EmissionFactureController } from './emission-facture.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmissionFactureEntity])],
  controllers: [EmissionFactureController],
  providers: [EmissionFactureService],
  exports: [EmissionFactureService],
})
export class EmissionFactureModule {}
