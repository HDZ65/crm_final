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
import { CreateTransporteurCompteDto } from '../../../../applications/dto/transporteur-compte/create-transporteur-compte.dto';
import { UpdateTransporteurCompteDto } from '../../../../applications/dto/transporteur-compte/update-transporteur-compte.dto';
import { TransporteurCompteDto } from '../../../../applications/dto/transporteur-compte/transporteur-compte-response.dto';
import { CreateTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/create-transporteur-compte.usecase';
import { GetTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/get-transporteur-compte.usecase';
import { UpdateTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/update-transporteur-compte.usecase';
import { DeleteTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/delete-transporteur-compte.usecase';

@Controller('transporteurcomptes')
export class TransporteurCompteController {
  constructor(
    private readonly createUseCase: CreateTransporteurCompteUseCase,
    private readonly getUseCase: GetTransporteurCompteUseCase,
    private readonly updateUseCase: UpdateTransporteurCompteUseCase,
    private readonly deleteUseCase: DeleteTransporteurCompteUseCase,
  ) {}

  @Roles({ roles: ['realm:logistique', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTransporteurCompteDto,
  ): Promise<TransporteurCompteDto> {
    const entity = await this.createUseCase.execute(dto);
    return new TransporteurCompteDto(entity);
  }

  @Roles({ roles: ['realm:logistique', 'realm:commercial', 'realm:user'] })
  @Get()
  async findAll(): Promise<TransporteurCompteDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new TransporteurCompteDto(entity));
  }

  @Roles({ roles: ['realm:logistique', 'realm:commercial', 'realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TransporteurCompteDto> {
    const entity = await this.getUseCase.execute(id);
    return new TransporteurCompteDto(entity);
  }

  @Roles({ roles: ['realm:logistique', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransporteurCompteDto,
  ): Promise<TransporteurCompteDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new TransporteurCompteDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
