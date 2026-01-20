import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { CreateEvenementSuiviDto } from '../../../../../applications/dto/evenement-suivi/create-evenement-suivi.dto';
import { UpdateEvenementSuiviDto } from '../../../../../applications/dto/evenement-suivi/update-evenement-suivi.dto';
import { EvenementSuiviDto } from '../../../../../applications/dto/evenement-suivi/evenement-suivi-response.dto';
import { CreateEvenementSuiviUseCase } from '../../../../../applications/usecase/evenement-suivi/create-evenement-suivi.usecase';
import { GetEvenementSuiviUseCase } from '../../../../../applications/usecase/evenement-suivi/get-evenement-suivi.usecase';
import { UpdateEvenementSuiviUseCase } from '../../../../../applications/usecase/evenement-suivi/update-evenement-suivi.usecase';
import { DeleteEvenementSuiviUseCase } from '../../../../../applications/usecase/evenement-suivi/delete-evenement-suivi.usecase';

@Controller('evenementsuivis')
export class EvenementSuiviController {
  constructor(
    private readonly createUseCase: CreateEvenementSuiviUseCase,
    private readonly getUseCase: GetEvenementSuiviUseCase,
    private readonly updateUseCase: UpdateEvenementSuiviUseCase,
    private readonly deleteUseCase: DeleteEvenementSuiviUseCase,
  ) {}

  @Roles({ roles: ['realm:user'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateEvenementSuiviDto,
  ): Promise<EvenementSuiviDto> {
    const entity = await this.createUseCase.execute(dto);
    return new EvenementSuiviDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<EvenementSuiviDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new EvenementSuiviDto(entity));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<EvenementSuiviDto> {
    const entity = await this.getUseCase.execute(id);
    return new EvenementSuiviDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEvenementSuiviDto,
  ): Promise<EvenementSuiviDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new EvenementSuiviDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
