import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { UsersGrpcClient } from '../grpc/users-grpc.client';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersGrpcClient: UsersGrpcClient) {}

  @Post('utilisateurs')
  @ApiOperation({ summary: 'Create user' })
  createUtilisateur(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createUtilisateur(body));
  }

  @Put('utilisateurs/:id')
  @ApiOperation({ summary: 'Update user' })
  updateUtilisateur(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.updateUtilisateur({ ...body, id }));
  }

  @Get('utilisateurs/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  getUtilisateur(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.getUtilisateur({ id }));
  }

  @Get('utilisateurs/keycloak/:keycloakId')
  @ApiOperation({ summary: 'Get user by Keycloak ID' })
  getUtilisateurByKeycloakId(@Param('keycloakId') keycloakId: string) {
    return firstValueFrom(
      this.usersGrpcClient.getUtilisateurByKeycloakId({ keycloak_id: keycloakId }),
    );
  }

  @Get('utilisateurs/email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  getUtilisateurByEmail(@Param('email') email: string) {
    return firstValueFrom(this.usersGrpcClient.getUtilisateurByEmail({ email }));
  }

  @Get('utilisateurs')
  @ApiOperation({ summary: 'List users' })
  listUtilisateurs(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.listUtilisateurs(query));
  }

  @Delete('utilisateurs/:id')
  @ApiOperation({ summary: 'Delete user' })
  deleteUtilisateur(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.deleteUtilisateur({ id }));
  }

  @Get('utilisateurs/profile/:keycloakId')
  @ApiOperation({ summary: 'Get user profile by Keycloak ID' })
  getUtilisateurProfile(@Param('keycloakId') keycloakId: string) {
    return firstValueFrom(this.usersGrpcClient.getUtilisateurProfile({ keycloak_id: keycloakId }));
  }

  @Post('auth-sync')
  @ApiOperation({ summary: 'Sync Keycloak user' })
  syncKeycloakUser(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.syncKeycloakUser(body));
  }

  @Get('auth-sync/keycloak/:keycloakId')
  @ApiOperation({ summary: 'Find synchronized user by Keycloak ID' })
  findAuthSyncByKeycloakId(@Param('keycloakId') keycloakId: string) {
    return firstValueFrom(
      this.usersGrpcClient.findAuthSyncByKeycloakId({ keycloak_id: keycloakId }),
    );
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create role' })
  createRole(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createRole(body));
  }

  @Put('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  updateRole(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.updateRole({ ...body, id }));
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  getRole(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.getRole({ id }));
  }

  @Get('roles/code/:code')
  @ApiOperation({ summary: 'Get role by code' })
  getRoleByCode(@Param('code') code: string) {
    return firstValueFrom(this.usersGrpcClient.getRoleByCode({ code }));
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles' })
  listRoles(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.listRoles(query));
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete role' })
  deleteRole(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.deleteRole({ id }));
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create permission' })
  createPermission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createPermission(body));
  }

  @Put('permissions/:id')
  @ApiOperation({ summary: 'Update permission' })
  updatePermission(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.updatePermission({ ...body, id }));
  }

  @Get('permissions/:id')
  @ApiOperation({ summary: 'Get permission by ID' })
  getPermission(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.getPermission({ id }));
  }

  @Get('permissions/code/:code')
  @ApiOperation({ summary: 'Get permission by code' })
  getPermissionByCode(@Param('code') code: string) {
    return firstValueFrom(this.usersGrpcClient.getPermissionByCode({ code }));
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List permissions' })
  listPermissions(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.listPermissions(query));
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Delete permission' })
  deletePermission(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.deletePermission({ id }));
  }

  @Post('role-permissions')
  @ApiOperation({ summary: 'Create role permission' })
  createRolePermission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createRolePermission(body));
  }

  @Get('role-permissions/:id')
  @ApiOperation({ summary: 'Get role permission by ID' })
  getRolePermission(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.getRolePermission({ id }));
  }

  @Get('role-permissions')
  @ApiOperation({ summary: 'List role permissions by role' })
  listRolePermissionsByRole(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.listRolePermissionsByRole(query));
  }

  @Delete('role-permissions/:id')
  @ApiOperation({ summary: 'Delete role permission' })
  deleteRolePermission(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.deleteRolePermission({ id }));
  }

  @Post('comptes')
  @ApiOperation({ summary: 'Create account' })
  createCompte(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createCompte(body));
  }

  @Post('comptes/with-owner')
  @ApiOperation({ summary: 'Create account with owner' })
  createCompteWithOwner(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createCompteWithOwner(body));
  }

  @Put('comptes/:id')
  @ApiOperation({ summary: 'Update account' })
  updateCompte(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.updateCompte({ ...body, id }));
  }

  @Get('comptes/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  getCompte(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.getCompte({ id }));
  }

  @Get('comptes')
  @ApiOperation({ summary: 'List accounts' })
  listComptes(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.listComptes(query));
  }

  @Delete('comptes/:id')
  @ApiOperation({ summary: 'Delete account' })
  deleteCompte(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.deleteCompte({ id }));
  }

  @Post('membres-comptes')
  @ApiOperation({ summary: 'Create account member' })
  createMembreCompte(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createMembreCompte(body));
  }

  @Put('membres-comptes/:id')
  @ApiOperation({ summary: 'Update account member' })
  updateMembreCompte(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.updateMembreCompte({ ...body, id }));
  }

  @Get('membres-comptes/:id')
  @ApiOperation({ summary: 'Get account member by ID' })
  getMembreCompte(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.getMembreCompte({ id }));
  }

  @Get('membres-comptes/organisation/:organisationId')
  @ApiOperation({ summary: 'List account members by organisation' })
  listMembresCompteByOrganisation(@Param('organisationId') organisationId: string) {
    return firstValueFrom(
      this.usersGrpcClient.listMembresCompteByOrganisation({ organisation_id: organisationId }),
    );
  }

  @Get('membres-comptes/utilisateur/:utilisateurId')
  @ApiOperation({ summary: 'List account members by user' })
  listMembresCompteByUtilisateur(@Param('utilisateurId') utilisateurId: string) {
    return firstValueFrom(
      this.usersGrpcClient.listMembresCompteByUtilisateur({ utilisateur_id: utilisateurId }),
    );
  }

  @Delete('membres-comptes/:id')
  @ApiOperation({ summary: 'Delete account member' })
  deleteMembreCompte(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.deleteMembreCompte({ id }));
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Create account invitation' })
  createInvitationCompte(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.createInvitationCompte(body));
  }

  @Put('invitations/:id')
  @ApiOperation({ summary: 'Update account invitation' })
  updateInvitationCompte(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(this.usersGrpcClient.updateInvitationCompte({ ...body, id }));
  }

  @Get('invitations/:id')
  @ApiOperation({ summary: 'Get account invitation by ID' })
  getInvitationCompte(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.getInvitationCompte({ id }));
  }

  @Get('invitations/token/:token')
  @ApiOperation({ summary: 'Get account invitation by token' })
  getInvitationCompteByToken(@Param('token') token: string) {
    return firstValueFrom(this.usersGrpcClient.getInvitationCompteByToken({ token }));
  }

  @Get('invitations')
  @ApiOperation({ summary: 'List account invitations by organisation' })
  listInvitationsCompteByOrganisation(@Query() query: Record<string, unknown>) {
    return firstValueFrom(
      this.usersGrpcClient.listInvitationsCompteByOrganisation(query),
    );
  }

  @Delete('invitations/:id')
  @ApiOperation({ summary: 'Delete account invitation' })
  deleteInvitationCompte(@Param('id') id: string) {
    return firstValueFrom(this.usersGrpcClient.deleteInvitationCompte({ id }));
  }

  @Post('invitations/accept')
  @ApiOperation({ summary: 'Accept account invitation' })
  acceptInvitationCompte(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.usersGrpcClient.acceptInvitationCompte(body));
  }
}
