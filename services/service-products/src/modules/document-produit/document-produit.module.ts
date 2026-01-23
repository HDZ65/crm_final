import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentProduitEntity } from './entities/document-produit.entity';
import { DocumentProduitService } from './document-produit.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentProduitEntity])],
  providers: [DocumentProduitService],
  exports: [DocumentProduitService],
})
export class DocumentProduitModule {}
