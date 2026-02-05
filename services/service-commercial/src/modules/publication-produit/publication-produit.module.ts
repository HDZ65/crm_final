import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationProduitEntity } from './entities/publication-produit.entity';
import { PublicationProduitService } from './publication-produit.service';
import { PublicationProduitController } from './publication-produit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PublicationProduitEntity])],
  controllers: [PublicationProduitController],
  providers: [PublicationProduitService],
  exports: [PublicationProduitService],
})
export class PublicationProduitModule {}
