import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrixProduitEntity } from './entities/prix-produit.entity';
import { PrixProduitService } from './prix-produit.service';
import { PrixProduitController } from './prix-produit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrixProduitEntity])],
  controllers: [PrixProduitController],
  providers: [PrixProduitService],
  exports: [PrixProduitService],
})
export class PrixProduitModule {}
