import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartenaireMarqueBlancheEntity } from './entities/partenaire-marque-blanche.entity';
import { PartenaireMarqueBlancheService } from './partenaire-marque-blanche.service';
import { PartenaireMarqueBlancheController } from './partenaire-marque-blanche.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PartenaireMarqueBlancheEntity])],
  controllers: [PartenaireMarqueBlancheController],
  providers: [PartenaireMarqueBlancheService],
  exports: [PartenaireMarqueBlancheService],
})
export class PartenaireMarqueBlancheModule {}
