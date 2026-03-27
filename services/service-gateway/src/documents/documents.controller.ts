import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { DocumentsGrpcClient } from '../grpc/documents-grpc.client';

@ApiTags('Documents')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsClient: DocumentsGrpcClient) {}

  // ==================== PIECES JOINTES ====================

  @Post('pieces-jointes')
  @ApiOperation({ summary: 'Create piece jointe' })
  createPieceJointe(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.documentsClient.createPieceJointe(body));
  }

  @Get('pieces-jointes/:id')
  @ApiOperation({ summary: 'Get piece jointe by ID' })
  getPieceJointe(@Param('id') id: string) {
    return firstValueFrom(this.documentsClient.getPieceJointe({ id }));
  }

  @Get('pieces-jointes')
  @ApiOperation({ summary: 'List pieces jointes' })
  listPiecesJointes(
    @Query('search') search?: string,
    @Query('type_mime') typeMime?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.documentsClient.listPiecesJointes({
        search,
        type_mime: typeMime,
        pagination: {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        },
      }),
    );
  }

  @Get('pieces-jointes/by-entite/:entiteType/:entiteId')
  @ApiOperation({ summary: 'List pieces jointes by entity' })
  listPiecesJointesByEntite(
    @Param('entiteType') entiteType: string,
    @Param('entiteId') entiteId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.documentsClient.listPiecesJointesByEntite({
        entite_type: entiteType,
        entite_id: entiteId,
        pagination: {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        },
      }),
    );
  }

  @Put('pieces-jointes/:id')
  @ApiOperation({ summary: 'Update piece jointe' })
  updatePieceJointe(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.documentsClient.updatePieceJointe({ ...body, id }),
    );
  }

  @Delete('pieces-jointes/:id')
  @ApiOperation({ summary: 'Delete piece jointe' })
  deletePieceJointe(@Param('id') id: string) {
    return firstValueFrom(this.documentsClient.deletePieceJointe({ id }));
  }

  // ==================== BOITES MAIL ====================

  @Post('boites-mail')
  @ApiOperation({ summary: 'Create boite mail' })
  createBoiteMail(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.documentsClient.createBoiteMail(body));
  }

  @Get('boites-mail/:id')
  @ApiOperation({ summary: 'Get boite mail by ID' })
  getBoiteMail(@Param('id') id: string) {
    return firstValueFrom(this.documentsClient.getBoiteMail({ id }));
  }

  @Get('boites-mail/by-utilisateur/:utilisateurId')
  @ApiOperation({ summary: 'Get boite mail by user' })
  getBoiteMailByUtilisateur(@Param('utilisateurId') utilisateurId: string) {
    return firstValueFrom(
      this.documentsClient.getBoiteMailByUtilisateur({
        utilisateur_id: utilisateurId,
      }),
    );
  }

  @Get('boites-mail/default/:utilisateurId')
  @ApiOperation({ summary: 'Get default boite mail for user' })
  getDefaultBoiteMail(@Param('utilisateurId') utilisateurId: string) {
    return firstValueFrom(
      this.documentsClient.getDefaultBoiteMail({
        utilisateur_id: utilisateurId,
      }),
    );
  }

  @Get('boites-mail')
  @ApiOperation({ summary: 'List boites mail' })
  listBoitesMail(
    @Query('search') search?: string,
    @Query('fournisseur') fournisseur?: string,
    @Query('actif') actif?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.documentsClient.listBoitesMail({
        search,
        fournisseur,
        actif: actif === 'true',
        pagination: {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        },
      }),
    );
  }

  @Get('boites-mail/by-utilisateur-list/:utilisateurId')
  @ApiOperation({ summary: 'List boites mail by user' })
  listBoitesMailByUtilisateur(
    @Param('utilisateurId') utilisateurId: string,
    @Query('actif') actif?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.documentsClient.listBoitesMailByUtilisateur({
        utilisateur_id: utilisateurId,
        actif: actif === 'true',
        pagination: {
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 20,
        },
      }),
    );
  }

  @Put('boites-mail/:id')
  @ApiOperation({ summary: 'Update boite mail' })
  updateBoiteMail(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.documentsClient.updateBoiteMail({ ...body, id }),
    );
  }

  @Post('boites-mail/:id/set-default')
  @ApiOperation({ summary: 'Set boite mail as default' })
  setDefaultBoiteMail(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.documentsClient.setDefaultBoiteMail({ ...body, id }),
    );
  }

  @Post('boites-mail/:id/activer')
  @ApiOperation({ summary: 'Activate boite mail' })
  activerBoiteMail(@Param('id') id: string) {
    return firstValueFrom(this.documentsClient.activerBoiteMail({ id }));
  }

  @Post('boites-mail/:id/desactiver')
  @ApiOperation({ summary: 'Deactivate boite mail' })
  desactiverBoiteMail(@Param('id') id: string) {
    return firstValueFrom(this.documentsClient.desactiverBoiteMail({ id }));
  }

  @Put('boites-mail/:id/oauth-tokens')
  @ApiOperation({ summary: 'Update OAuth tokens for boite mail' })
  updateOAuthTokens(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.documentsClient.updateOAuthTokens({ ...body, id }),
    );
  }

  @Post('boites-mail/:id/test-connection')
  @ApiOperation({ summary: 'Test boite mail connection' })
  testConnection(@Param('id') id: string) {
    return firstValueFrom(this.documentsClient.testConnection({ id }));
  }

  @Delete('boites-mail/:id')
  @ApiOperation({ summary: 'Delete boite mail' })
  deleteBoiteMail(@Param('id') id: string) {
    return firstValueFrom(this.documentsClient.deleteBoiteMail({ id }));
  }
}
