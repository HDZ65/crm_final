import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrixProduitEntity } from './entities/prix-produit.entity';
import { PrixProduitService } from './prix-produit.service';

@Module({
  imports: [TypeOrmModule.forFeature([PrixProduitEntity])],
  providers: [PrixProduitService],
  exports: [PrixProduitService],
})
export class PrixProduitModule {}
