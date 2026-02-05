import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentProduitEntity } from './entities/document-produit.entity';
import { DocumentProduitService } from './document-produit.service';
import { DocumentProduitController } from './document-produit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentProduitEntity])],
  controllers: [DocumentProduitController],
  providers: [DocumentProduitService],
  exports: [DocumentProduitService],
})
export class DocumentProduitModule {}
