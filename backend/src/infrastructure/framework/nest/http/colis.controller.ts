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
import { CreateColisDto } from '../../../../applications/dto/colis/create-colis.dto';
import { UpdateColisDto } from '../../../../applications/dto/colis/update-colis.dto';
import { ColisDto } from '../../../../applications/dto/colis/colis-response.dto';
import { CreateColisUseCase } from '../../../../applications/usecase/colis/create-colis.usecase';
import { GetColisUseCase } from '../../../../applications/usecase/colis/get-colis.usecase';
import { UpdateColisUseCase } from '../../../../applications/usecase/colis/update-colis.usecase';
import { DeleteColisUseCase } from '../../../../applications/usecase/colis/delete-colis.usecase';

@Controller('colis')
export class ColisController {
  constructor(
    private readonly createUseCase: CreateColisUseCase,
    private readonly getUseCase: GetColisUseCase,
    private readonly updateUseCase: UpdateColisUseCase,
    private readonly deleteUseCase: DeleteColisUseCase,
  ) {}

  @Roles({ roles: ['realm:logistique', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateColisDto): Promise<ColisDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ColisDto(entity);
  }

  @Roles({ roles: ['realm:logistique', 'realm:commercial', 'realm:user'] })
  @Get()
  async findAll(): Promise<ColisDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new ColisDto(entity));
  }

  @Roles({ roles: ['realm:logistique', 'realm:commercial', 'realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ColisDto> {
    const entity = await this.getUseCase.execute(id);
    return new ColisDto(entity);
  }

  @Roles({ roles: ['realm:logistique', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateColisDto,
  ): Promise<ColisDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ColisDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
