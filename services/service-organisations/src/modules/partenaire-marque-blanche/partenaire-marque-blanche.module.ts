import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartenaireMarqueBlancheEntity } from './entities/partenaire-marque-blanche.entity';
import { PartenaireMarqueBlancheService } from './partenaire-marque-blanche.service';

@Module({
  imports: [TypeOrmModule.forFeature([PartenaireMarqueBlancheEntity])],
  providers: [PartenaireMarqueBlancheService],
  exports: [PartenaireMarqueBlancheService],
})
export class PartenaireMarqueBlancheModule {}
