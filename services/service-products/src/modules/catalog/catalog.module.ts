import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ProduitModule } from '../produit/produit.module';
import { GrilleTarifaireModule } from '../grille-tarifaire/grille-tarifaire.module';
import { PrixProduitModule } from '../prix-produit/prix-produit.module';

@Module({
  imports: [ProduitModule, GrilleTarifaireModule, PrixProduitModule],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
