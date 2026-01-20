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
import { CreateClientEntrepriseDto } from '../../../../../applications/dto/client-entreprise/create-client-entreprise.dto';
import { UpdateClientEntrepriseDto } from '../../../../../applications/dto/client-entreprise/update-client-entreprise.dto';
import { ClientEntrepriseDto } from '../../../../../applications/dto/client-entreprise/client-entreprise-response.dto';
import { CreateClientEntrepriseUseCase } from '../../../../../applications/usecase/client-entreprise/create-client-entreprise.usecase';
import { GetClientEntrepriseUseCase } from '../../../../../applications/usecase/client-entreprise/get-client-entreprise.usecase';
import { UpdateClientEntrepriseUseCase } from '../../../../../applications/usecase/client-entreprise/update-client-entreprise.usecase';
import { DeleteClientEntrepriseUseCase } from '../../../../../applications/usecase/client-entreprise/delete-client-entreprise.usecase';

@Controller('cliententreprises')
export class ClientEntrepriseController {
  constructor(
    private readonly createUseCase: CreateClientEntrepriseUseCase,
    private readonly getUseCase: GetClientEntrepriseUseCase,
    private readonly updateUseCase: UpdateClientEntrepriseUseCase,
    private readonly deleteUseCase: DeleteClientEntrepriseUseCase,
  ) {}

  @Roles({ roles: ['realm:commercial', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateClientEntrepriseDto,
  ): Promise<ClientEntrepriseDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ClientEntrepriseDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<ClientEntrepriseDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ClientEntrepriseDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ClientEntrepriseDto> {
    const entity = await this.getUseCase.execute(id);
    return new ClientEntrepriseDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientEntrepriseDto,
  ): Promise<ClientEntrepriseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ClientEntrepriseDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
