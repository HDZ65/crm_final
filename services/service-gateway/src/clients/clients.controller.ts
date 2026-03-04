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
import { ClientsGrpcClient } from '../grpc/clients-grpc.client';

@ApiTags('Clients')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/clients')
export class ClientsController {
  constructor(private readonly clientsGrpcClient: ClientsGrpcClient) {}

  @Post('statuts')
  @ApiOperation({ summary: 'Create client status' })
  createStatut(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.createStatutClient(body));
  }

  @Put('statuts/:id')
  @ApiOperation({ summary: 'Update client status' })
  updateStatut(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.updateStatutClient({ ...body, id }));
  }

  @Get('statuts/:id')
  @ApiOperation({ summary: 'Get client status by ID' })
  getStatut(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.getStatutClient({ id }));
  }

  @Get('statuts/code/:code')
  @ApiOperation({ summary: 'Get client status by code' })
  getStatutByCode(@Param('code') code: string) {
    return firstValueFrom(this.clientsGrpcClient.getStatutClientByCode({ code }));
  }

  @Get('statuts')
  @ApiOperation({ summary: 'List client statuses' })
  listStatuts(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.listStatutsClient(query));
  }

  @Delete('statuts/:id')
  @ApiOperation({ summary: 'Delete client status' })
  deleteStatut(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.deleteStatutClient({ id }));
  }

  @Post('adresses')
  @ApiOperation({ summary: 'Create address' })
  createAdresse(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.createAdresse(body));
  }

  @Put('adresses/:id')
  @ApiOperation({ summary: 'Update address' })
  updateAdresse(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.updateAdresse({ ...body, id }));
  }

  @Get('adresses/:id')
  @ApiOperation({ summary: 'Get address by ID' })
  getAdresse(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.getAdresse({ id }));
  }

  @Get('adresses')
  @ApiOperation({ summary: 'List addresses by client' })
  listAdresses(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.listAdressesByClient(query));
  }

  @Delete('adresses/:id')
  @ApiOperation({ summary: 'Delete address' })
  deleteAdresse(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.deleteAdresse({ id }));
  }

  @Post('base')
  @ApiOperation({ summary: 'Create base client' })
  createClientBase(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.createClientBase(body));
  }

  @Put('base/:id')
  @ApiOperation({ summary: 'Update base client' })
  updateClientBase(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.updateClientBase({ ...body, id }));
  }

  @Get('base/:id')
  @ApiOperation({ summary: 'Get base client by ID' })
  getClientBase(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.getClientBase({ id }));
  }

  @Get('base')
  @ApiOperation({ summary: 'List base clients' })
  listClientsBase(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.listClientsBase(query));
  }

  @Get('base/search')
  @ApiOperation({ summary: 'Search base client' })
  searchClientBase(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.searchClientBase(query));
  }

  @Delete('base/:id')
  @ApiOperation({ summary: 'Delete base client' })
  deleteClientBase(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.deleteClientBase({ id }));
  }

  @Post('entreprises')
  @ApiOperation({ summary: 'Create company client' })
  createClientEntreprise(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.createClientEntreprise(body));
  }

  @Put('entreprises/:id')
  @ApiOperation({ summary: 'Update company client' })
  updateClientEntreprise(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.clientsGrpcClient.updateClientEntreprise({ ...body, id }),
    );
  }

  @Get('entreprises/:id')
  @ApiOperation({ summary: 'Get company client by ID' })
  getClientEntreprise(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.getClientEntreprise({ id }));
  }

  @Get('entreprises')
  @ApiOperation({ summary: 'List company clients' })
  listClientsEntreprise(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.listClientsEntreprise(query));
  }

  @Delete('entreprises/:id')
  @ApiOperation({ summary: 'Delete company client' })
  deleteClientEntreprise(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.deleteClientEntreprise({ id }));
  }

  @Post('partenaires')
  @ApiOperation({ summary: 'Create partner client link' })
  createClientPartenaire(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.createClientPartenaire(body));
  }

  @Put('partenaires/:id')
  @ApiOperation({ summary: 'Update partner client link' })
  updateClientPartenaire(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.clientsGrpcClient.updateClientPartenaire({ ...body, id }),
    );
  }

  @Get('partenaires/:id')
  @ApiOperation({ summary: 'Get partner client link by ID' })
  getClientPartenaire(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.getClientPartenaire({ id }));
  }

  @Get('partenaires')
  @ApiOperation({ summary: 'List partner client links' })
  listClientsPartenaire(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.clientsGrpcClient.listClientsPartenaire(query));
  }

  @Delete('partenaires/:id')
  @ApiOperation({ summary: 'Delete partner client link' })
  deleteClientPartenaire(@Param('id') id: string) {
    return firstValueFrom(this.clientsGrpcClient.deleteClientPartenaire({ id }));
  }
}
