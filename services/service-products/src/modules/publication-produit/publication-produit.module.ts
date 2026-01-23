import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationProduitEntity } from './entities/publication-produit.entity';
import { PublicationProduitService } from './publication-produit.service';

@Module({
  imports: [TypeOrmModule.forFeature([PublicationProduitEntity])],
  providers: [PublicationProduitService],
  exports: [PublicationProduitService],
})
export class PublicationProduitModule {}
