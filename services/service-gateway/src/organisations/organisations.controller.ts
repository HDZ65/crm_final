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
import { OrganisationsGrpcClient } from '../grpc/organisations-grpc.client';

@ApiTags('Organisations')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/organisations')
export class OrganisationsController {
  constructor(private readonly organisationsClient: OrganisationsGrpcClient) {}

  @Post('organisations')
  @ApiOperation({ summary: 'Create organisation' })
  createOrganisation(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.organisationCreate(body));
  }

  @Post('organisations/with-owner')
  @ApiOperation({ summary: 'Create organisation with owner' })
  createOrganisationWithOwner(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.organisationCreateWithOwner(body));
  }

  @Put('organisations/:id')
  @ApiOperation({ summary: 'Update organisation' })
  updateOrganisation(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(this.organisationsClient.organisationUpdate({ ...body, id }));
  }

  @Get('organisations/:id')
  @ApiOperation({ summary: 'Get organisation' })
  getOrganisation(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.organisationGet({ id }));
  }

  @Post('organisations/list')
  @ApiOperation({ summary: 'List organisations' })
  listOrganisations(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.organisationList(body));
  }

  @Delete('organisations/:id')
  @ApiOperation({ summary: 'Delete organisation' })
  deleteOrganisation(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.organisationDelete({ id }));
  }

  @Post('societes')
  @ApiOperation({ summary: 'Create societe' })
  createSociete(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.societeCreate(body));
  }

  @Put('societes/:id')
  @ApiOperation({ summary: 'Update societe' })
  updateSociete(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.societeUpdate({ ...body, id }));
  }

  @Get('societes/:id')
  @ApiOperation({ summary: 'Get societe' })
  getSociete(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.societeGet({ id }));
  }

  @Get('societes/by-organisation/:organisationId')
  @ApiOperation({ summary: 'List societes by organisation' })
  listSocietesByOrganisation(@Param('organisationId') organisationId: string) {
    return firstValueFrom(
      this.organisationsClient.societeListByOrganisation({ organisation_id: organisationId }),
    );
  }

  @Post('societes/list')
  @ApiOperation({ summary: 'List societes' })
  listSocietes(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.societeList(body));
  }

  @Delete('societes/:id')
  @ApiOperation({ summary: 'Delete societe' })
  deleteSociete(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.societeDelete({ id }));
  }

  @Post('statuts-partenaires')
  @ApiOperation({ summary: 'Create statut partenaire' })
  createStatutPartenaire(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.statutPartenaireCreate(body));
  }

  @Put('statuts-partenaires/:id')
  @ApiOperation({ summary: 'Update statut partenaire' })
  updateStatutPartenaire(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.organisationsClient.statutPartenaireUpdate({
        ...body,
        id,
      }),
    );
  }

  @Get('statuts-partenaires/:id')
  @ApiOperation({ summary: 'Get statut partenaire' })
  getStatutPartenaire(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.statutPartenaireGet({ id }));
  }

  @Get('statuts-partenaires/by-code/:code')
  @ApiOperation({ summary: 'Get statut partenaire by code' })
  getStatutPartenaireByCode(@Param('code') code: string) {
    return firstValueFrom(this.organisationsClient.statutPartenaireGetByCode({ code }));
  }

  @Post('statuts-partenaires/list')
  @ApiOperation({ summary: 'List statuts partenaires' })
  listStatutsPartenaires(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.statutPartenaireList(body));
  }

  @Delete('statuts-partenaires/:id')
  @ApiOperation({ summary: 'Delete statut partenaire' })
  deleteStatutPartenaire(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.statutPartenaireDelete({ id }));
  }

  @Post('partenaires-marque-blanche')
  @ApiOperation({ summary: 'Create partenaire marque blanche' })
  createPartenaireMarqueBlanche(@Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.organisationsClient.partenaireMarqueBlancheCreate(body),
    );
  }

  @Put('partenaires-marque-blanche/:id')
  @ApiOperation({ summary: 'Update partenaire marque blanche' })
  updatePartenaireMarqueBlanche(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.organisationsClient.partenaireMarqueBlancheUpdate({
        ...body,
        id,
      }),
    );
  }

  @Get('partenaires-marque-blanche/:id')
  @ApiOperation({ summary: 'Get partenaire marque blanche' })
  getPartenaireMarqueBlanche(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.partenaireMarqueBlancheGet({ id }));
  }

  @Post('partenaires-marque-blanche/list')
  @ApiOperation({ summary: 'List partenaires marque blanche' })
  listPartenairesMarqueBlanche(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.partenaireMarqueBlancheList(body));
  }

  @Delete('partenaires-marque-blanche/:id')
  @ApiOperation({ summary: 'Delete partenaire marque blanche' })
  deletePartenaireMarqueBlanche(@Param('id') id: string) {
    return firstValueFrom(
      this.organisationsClient.partenaireMarqueBlancheDelete({ id }),
    );
  }

  @Post('themes-marque')
  @ApiOperation({ summary: 'Create theme marque' })
  createThemeMarque(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.themeMarqueCreate(body));
  }

  @Put('themes-marque/:id')
  @ApiOperation({ summary: 'Update theme marque' })
  updateThemeMarque(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.themeMarqueUpdate({ ...body, id }));
  }

  @Get('themes-marque/:id')
  @ApiOperation({ summary: 'Get theme marque' })
  getThemeMarque(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.themeMarqueGet({ id }));
  }

  @Post('themes-marque/list')
  @ApiOperation({ summary: 'List themes marque' })
  listThemesMarque(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.themeMarqueList(body));
  }

  @Delete('themes-marque/:id')
  @ApiOperation({ summary: 'Delete theme marque' })
  deleteThemeMarque(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.themeMarqueDelete({ id }));
  }

  @Post('roles-partenaires')
  @ApiOperation({ summary: 'Create role partenaire' })
  createRolePartenaire(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.rolePartenaireCreate(body));
  }

  @Put('roles-partenaires/:id')
  @ApiOperation({ summary: 'Update role partenaire' })
  updateRolePartenaire(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.rolePartenaireUpdate({ ...body, id }));
  }

  @Get('roles-partenaires/:id')
  @ApiOperation({ summary: 'Get role partenaire' })
  getRolePartenaire(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.rolePartenaireGet({ id }));
  }

  @Get('roles-partenaires/by-code/:code')
  @ApiOperation({ summary: 'Get role partenaire by code' })
  getRolePartenaireByCode(@Param('code') code: string) {
    return firstValueFrom(this.organisationsClient.rolePartenaireGetByCode({ code }));
  }

  @Post('roles-partenaires/list')
  @ApiOperation({ summary: 'List roles partenaires' })
  listRolesPartenaires(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.rolePartenaireList(body));
  }

  @Delete('roles-partenaires/:id')
  @ApiOperation({ summary: 'Delete role partenaire' })
  deleteRolePartenaire(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.rolePartenaireDelete({ id }));
  }

  @Post('membres-partenaires')
  @ApiOperation({ summary: 'Create membre partenaire' })
  createMembrePartenaire(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.membrePartenaireCreate(body));
  }

  @Put('membres-partenaires/:id')
  @ApiOperation({ summary: 'Update membre partenaire' })
  updateMembrePartenaire(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.membrePartenaireUpdate({ ...body, id }));
  }

  @Get('membres-partenaires/:id')
  @ApiOperation({ summary: 'Get membre partenaire' })
  getMembrePartenaire(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.membrePartenaireGet({ id }));
  }

  @Get('membres-partenaires/by-partenaire/:partenaireId')
  @ApiOperation({ summary: 'List membres by partenaire' })
  listMembresByPartenaire(@Param('partenaireId') partenaireId: string) {
    return firstValueFrom(
      this.organisationsClient.membrePartenaireListByPartenaire({ partenaire_id: partenaireId }),
    );
  }

  @Get('membres-partenaires/by-utilisateur/:utilisateurId')
  @ApiOperation({ summary: 'List membres by utilisateur' })
  listMembresByUtilisateur(@Param('utilisateurId') utilisateurId: string) {
    return firstValueFrom(
      this.organisationsClient.membrePartenaireListByUtilisateur({
        utilisateur_id: utilisateurId,
      }),
    );
  }

  @Delete('membres-partenaires/:id')
  @ApiOperation({ summary: 'Delete membre partenaire' })
  deleteMembrePartenaire(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.membrePartenaireDelete({ id }));
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Create invitation compte' })
  createInvitation(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.invitationCompteCreate(body));
  }

  @Put('invitations/:id')
  @ApiOperation({ summary: 'Update invitation compte' })
  updateInvitation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.organisationsClient.invitationCompteUpdate({ ...body, id }));
  }

  @Get('invitations/:id')
  @ApiOperation({ summary: 'Get invitation compte' })
  getInvitation(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.invitationCompteGet({ id }));
  }

  @Get('invitations/by-token/:token')
  @ApiOperation({ summary: 'Get invitation compte by token' })
  getInvitationByToken(@Param('token') token: string) {
    return firstValueFrom(this.organisationsClient.invitationCompteGetByToken({ token }));
  }

  @Get('invitations/by-organisation/:organisationId')
  @ApiOperation({ summary: 'List invitations by organisation' })
  listInvitationsByOrganisation(@Param('organisationId') organisationId: string) {
    return firstValueFrom(
      this.organisationsClient.invitationCompteListByOrganisation({
        organisation_id: organisationId,
      }),
    );
  }

  @Get('invitations/pending-by-email/:email')
  @ApiOperation({ summary: 'List pending invitations by email' })
  listPendingInvitationsByEmail(@Param('email') email: string) {
    return firstValueFrom(
      this.organisationsClient.invitationCompteListPendingByEmail({ email }),
    );
  }

  @Post('invitations/:id/accept')
  @ApiOperation({ summary: 'Accept invitation compte' })
  acceptInvitation(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.invitationCompteAccept({ id }));
  }

  @Post('invitations/:id/reject')
  @ApiOperation({ summary: 'Reject invitation compte' })
  rejectInvitation(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.invitationCompteReject({ id }));
  }

  @Post('invitations/:id/expire')
  @ApiOperation({ summary: 'Expire invitation compte' })
  expireInvitation(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.invitationCompteExpire({ id }));
  }

  @Delete('invitations/:id')
  @ApiOperation({ summary: 'Delete invitation compte' })
  deleteInvitation(@Param('id') id: string) {
    return firstValueFrom(this.organisationsClient.invitationCompteDelete({ id }));
  }
}
