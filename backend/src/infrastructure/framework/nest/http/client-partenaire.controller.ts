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
import { CreateClientPartenaireDto } from '../../../../applications/dto/client-partenaire/create-client-partenaire.dto';
import { UpdateClientPartenaireDto } from '../../../../applications/dto/client-partenaire/update-client-partenaire.dto';
import { ClientPartenaireDto } from '../../../../applications/dto/client-partenaire/client-partenaire-response.dto';
import { CreateClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/create-client-partenaire.usecase';
import { GetClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/get-client-partenaire.usecase';
import { UpdateClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/update-client-partenaire.usecase';
import { DeleteClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/delete-client-partenaire.usecase';

@Controller('clientpartenaires')
export class ClientPartenaireController {
  constructor(
    private readonly createUseCase: CreateClientPartenaireUseCase,
    private readonly getUseCase: GetClientPartenaireUseCase,
    private readonly updateUseCase: UpdateClientPartenaireUseCase,
    private readonly deleteUseCase: DeleteClientPartenaireUseCase,
  ) {}

  @Roles({ roles: ['realm:commercial', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateClientPartenaireDto,
  ): Promise<ClientPartenaireDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ClientPartenaireDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<ClientPartenaireDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ClientPartenaireDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ClientPartenaireDto> {
    const entity = await this.getUseCase.execute(id);
    return new ClientPartenaireDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientPartenaireDto,
  ): Promise<ClientPartenaireDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ClientPartenaireDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
