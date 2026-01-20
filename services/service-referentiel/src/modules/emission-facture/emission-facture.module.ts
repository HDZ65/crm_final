import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmissionFacture } from './entities/emission-facture.entity';
import { EmissionFactureService } from './emission-facture.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmissionFacture])],
  providers: [EmissionFactureService],
  exports: [EmissionFactureService],
})
export class EmissionFactureModule {}
