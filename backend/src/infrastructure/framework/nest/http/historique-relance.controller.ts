import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { HistoriqueRelanceDto } from '../../../../applications/dto/historique-relance/historique-relance-response.dto';
import { GetHistoriqueRelanceUseCase } from '../../../../applications/usecase/historique-relance/get-historique-relance.usecase';
import { DeleteHistoriqueRelanceUseCase } from '../../../../applications/usecase/historique-relance/delete-historique-relance.usecase';

@Controller('historique-relances')
export class HistoriqueRelanceController {
  constructor(
    private readonly getUseCase: GetHistoriqueRelanceUseCase,
    private readonly deleteUseCase: DeleteHistoriqueRelanceUseCase,
  ) {}

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(
    @Query('organisationId') organisationId?: string,
    @Query('regleRelanceId') regleRelanceId?: string,
    @Query('clientId') clientId?: string,
    @Query('contratId') contratId?: string,
    @Query('factureId') factureId?: string,
    @Query('limit') limit?: string,
  ): Promise<HistoriqueRelanceDto[]> {
    let entities;

    if (limit && organisationId) {
      entities = await this.getUseCase.executeRecent(organisationId, parseInt(limit, 10));
    } else if (regleRelanceId) {
      entities = await this.getUseCase.executeByRegleRelanceId(regleRelanceId);
    } else if (clientId) {
      entities = await this.getUseCase.executeByClientId(clientId);
    } else if (contratId) {
      entities = await this.getUseCase.executeByContratId(contratId);
    } else if (factureId) {
      entities = await this.getUseCase.executeByFactureId(factureId);
    } else if (organisationId) {
      entities = await this.getUseCase.executeByOrganisationId(organisationId);
    } else {
      entities = await this.getUseCase.executeAll();
    }

    return entities.map((e) => new HistoriqueRelanceDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HistoriqueRelanceDto> {
    const entity = await this.getUseCase.execute(id);
    return new HistoriqueRelanceDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
