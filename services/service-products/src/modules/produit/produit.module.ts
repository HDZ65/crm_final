import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduitEntity } from './entities/produit.entity';
import { ProduitService } from './produit.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProduitEntity])],
  providers: [ProduitService],
  exports: [ProduitService],
})
export class ProduitModule {}
