import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { ProductsGrpcClient } from '../grpc/products-grpc.client';

@ApiTags('Products')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsClient: ProductsGrpcClient) {}

  @Post('gammes')
  @ApiOperation({ summary: 'Create gamme' })
  createGamme(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.gammeCreate(body));
  }

  @Put('gammes/:id')
  @ApiOperation({ summary: 'Update gamme' })
  updateGamme(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.gammeUpdate({ ...body, id }));
  }

  @Get('gammes/:id')
  @ApiOperation({ summary: 'Get gamme by id' })
  getGamme(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.gammeGet({ id }));
  }

  @Post('gammes/list')
  @ApiOperation({ summary: 'List gammes' })
  listGammes(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.gammeList(body));
  }

  @Delete('gammes/:id')
  @ApiOperation({ summary: 'Delete gamme' })
  deleteGamme(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.gammeDelete({ id }));
  }

  @Post('gammes/tree')
  @ApiOperation({ summary: 'Get gamme tree' })
  getGammeTree(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.gammeGetTree(body));
  }

  @Post('produits')
  @ApiOperation({ summary: 'Create produit' })
  createProduit(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitCreate(body));
  }

  @Put('produits/:id')
  @ApiOperation({ summary: 'Update produit' })
  updateProduit(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitUpdate({ ...body, id }));
  }

  @Get('produits/:id')
  @ApiOperation({ summary: 'Get produit by id' })
  getProduit(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitGet({ id }));
  }

  @Get('produits/by-sku/:organisationId/:sku')
  @ApiOperation({ summary: 'Get produit by sku' })
  getProduitBySku(
    @Param('organisationId') organisationId: string,
    @Param('sku') sku: string,
  ) {
    return firstValueFrom(this.productsClient.produitGetBySku({ organisation_id: organisationId, sku }));
  }

  @Post('produits/list')
  @ApiOperation({ summary: 'List produits' })
  listProduits(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitList(body));
  }

  @Delete('produits/:id')
  @ApiOperation({ summary: 'Delete produit' })
  deleteProduit(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitDelete({ id }));
  }

  @Post('produits/:id/set-promotion')
  @ApiOperation({ summary: 'Set produit promotion' })
  setProduitPromotion(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitSetPromotion({ ...body, produit_id: id }));
  }

  @Post('produits/:id/clear-promotion')
  @ApiOperation({ summary: 'Clear produit promotion' })
  clearProduitPromotion(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitClearPromotion({ produit_id: id }));
  }

  @Post('produits/:id/activer')
  @ApiOperation({ summary: 'Activate produit' })
  activerProduit(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitUpdate({ id, actif: true }));
  }

  @Post('produits/:id/desactiver')
  @ApiOperation({ summary: 'Deactivate produit' })
  desactiverProduit(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitUpdate({ id, actif: false }));
  }

  @Post('produits/bulk-create')
  @ApiOperation({ summary: 'Bulk create produits' })
  async bulkCreateProduits(@Body() body: Record<string, unknown>) {
    const items = Array.isArray(body.items) ? body.items : [];
    const created = await Promise.all(
      items.map((item) =>
        firstValueFrom(
          this.productsClient.produitCreate(
            item && typeof item === 'object' ? (item as Record<string, unknown>) : {},
          ),
        ),
      ),
    );
    return { count: created.length, created };
  }

  @Post('versions')
  @ApiOperation({ summary: 'Create produit version' })
  createVersion(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitVersionCreate(body));
  }

  @Put('versions/:id')
  @ApiOperation({ summary: 'Update produit version' })
  updateVersion(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitVersionUpdate({ ...body, id }));
  }

  @Get('versions/:id')
  @ApiOperation({ summary: 'Get produit version by id' })
  getVersion(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitVersionGet({ id }));
  }

  @Post('versions/list')
  @ApiOperation({ summary: 'List produit versions by produit' })
  listVersions(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitVersionListByProduit(body));
  }

  @Delete('versions/:id')
  @ApiOperation({ summary: 'Delete produit version' })
  deleteVersion(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitVersionUpdate({ id, deleted: true }));
  }

  @Post('versions/:id/set-par-defaut')
  @ApiOperation({ summary: 'Set produit version as default' })
  setVersionParDefaut(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitVersionUpdate({ ...body, id }));
  }

  @Post('documents')
  @ApiOperation({ summary: 'Create produit document' })
  createDocument(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitDocumentCreate(body));
  }

  @Put('documents/:id')
  @ApiOperation({ summary: 'Update produit document' })
  updateDocument(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitDocumentUpdate({ ...body, id }));
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get produit document by id' })
  getDocument(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitDocumentGet({ id }));
  }

  @Post('documents/list')
  @ApiOperation({ summary: 'List produit documents by version' })
  listDocuments(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitDocumentListByVersion(body));
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Delete produit document' })
  deleteDocument(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitDocumentUpdate({ id, deleted: true }));
  }

  @Post('publications')
  @ApiOperation({ summary: 'Create produit publication' })
  createPublication(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitPublicationCreate(body));
  }

  @Put('publications/:id')
  @ApiOperation({ summary: 'Update produit publication' })
  updatePublication(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitPublicationUpdate({ ...body, id }));
  }

  @Get('publications/:id')
  @ApiOperation({ summary: 'Get produit publication by id' })
  getPublication(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitPublicationGet({ id }));
  }

  @Post('publications/list/by-version')
  @ApiOperation({ summary: 'List produit publications by version' })
  listPublicationsByVersion(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitPublicationListByVersion(body));
  }

  @Post('publications/list/by-societe')
  @ApiOperation({ summary: 'List produit publications by societe' })
  listPublicationsBySociete(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitPublicationListBySociete(body));
  }

  @Delete('publications/:id')
  @ApiOperation({ summary: 'Delete produit publication' })
  deletePublication(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.produitPublicationUpdate({ id, deleted: true }));
  }

  @Post('grilles-tarifaires')
  @ApiOperation({ summary: 'Create grille tarifaire' })
  createGrilleTarifaire(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.grilleTarifaireCreate(body));
  }

  @Put('grilles-tarifaires/:id')
  @ApiOperation({ summary: 'Update grille tarifaire' })
  updateGrilleTarifaire(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.grilleTarifaireUpdate({ ...body, id }));
  }

  @Get('grilles-tarifaires/:id')
  @ApiOperation({ summary: 'Get grille tarifaire by id' })
  getGrilleTarifaire(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.grilleTarifaireGet({ id }));
  }

  @Post('grilles-tarifaires/list')
  @ApiOperation({ summary: 'List grilles tarifaires' })
  listGrillesTarifaires(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.grilleTarifaireList(body));
  }

  @Delete('grilles-tarifaires/:id')
  @ApiOperation({ summary: 'Delete grille tarifaire' })
  deleteGrilleTarifaire(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.grilleTarifaireDelete({ id }));
  }

  @Post('grilles-tarifaires/:id/set-par-defaut')
  @ApiOperation({ summary: 'Set grille tarifaire as default' })
  setGrilleTarifaireParDefaut(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.grilleTarifaireSetParDefaut({ id }));
  }

  @Post('prix')
  @ApiOperation({ summary: 'Create prix produit' })
  createPrix(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.prixProduitCreate(body));
  }

  @Put('prix/:id')
  @ApiOperation({ summary: 'Update prix produit' })
  updatePrix(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.prixProduitUpdate({ ...body, id }));
  }

  @Get('prix/:id')
  @ApiOperation({ summary: 'Get prix produit by id' })
  getPrix(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.prixProduitGet({ id }));
  }

  @Post('prix/list')
  @ApiOperation({ summary: 'List prix produits' })
  listPrix(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.prixProduitList(body));
  }

  @Delete('prix/:id')
  @ApiOperation({ summary: 'Delete prix produit' })
  deletePrix(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.prixProduitDelete({ id }));
  }

  @Post('prix/by-produit')
  @ApiOperation({ summary: 'Get prix for produit in grille tarifaire' })
  getPrixForProduit(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.prixProduitGetForProduit(body));
  }

  @Post('prix/bulk-create')
  @ApiOperation({ summary: 'Bulk create prix produits' })
  bulkCreatePrix(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.prixProduitBulkCreate(body));
  }

  @Post('prix/calculate')
  @ApiOperation({ summary: 'Calculate product price' })
  calculatePrice(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.catalogCalculatePrice(body));
  }

  @Post('catalog/sync')
  @ApiOperation({ summary: 'Sync catalogue' })
  syncCatalogue(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.produitSyncCatalogue(body));
  }

  @Post('catalog/get')
  @ApiOperation({ summary: 'Get unified catalog' })
  getCatalog(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.catalogGetCatalog(body));
  }

  @Post('catalog/tree')
  @ApiOperation({ summary: 'Get gammes tree from catalog routes' })
  getCatalogTree(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.gammeGetTree(body));
  }

  @Post('formules')
  @ApiOperation({ summary: 'Create formule produit' })
  createFormule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.formuleProduitCreate(body));
  }

  @Put('formules/:id')
  @ApiOperation({ summary: 'Update formule produit' })
  updateFormule(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.formuleProduitUpdate({ ...body, id }));
  }

  @Get('formules/:id')
  @ApiOperation({ summary: 'Get formule produit by id' })
  getFormule(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.formuleProduitGet({ id }));
  }

  @Post('formules/list')
  @ApiOperation({ summary: 'List formules by produit' })
  listFormules(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.productsClient.formuleProduitListByProduit(body));
  }

  @Delete('formules/:id')
  @ApiOperation({ summary: 'Delete formule produit' })
  deleteFormule(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.formuleProduitDelete({ id }));
  }

  @Post('formules/:id/activer')
  @ApiOperation({ summary: 'Activate formule produit' })
  activerFormule(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.formuleProduitActiver({ id }));
  }

  @Post('formules/:id/desactiver')
  @ApiOperation({ summary: 'Deactivate formule produit' })
  desactiverFormule(@Param('id') id: string) {
    return firstValueFrom(this.productsClient.formuleProduitDesactiver({ id }));
  }
}
