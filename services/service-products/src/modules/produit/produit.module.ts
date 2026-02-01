import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduitEntity } from './entities/produit.entity';
import { ProduitService } from './produit.service';
import { ProduitController } from './produit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProduitEntity])],
  controllers: [ProduitController],
  providers: [ProduitService],
  exports: [ProduitService],
})
export class ProduitModule {}
