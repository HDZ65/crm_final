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
import { CreateTypeActiviteDto } from '../../../../applications/dto/type-activite/create-type-activite.dto';
import { UpdateTypeActiviteDto } from '../../../../applications/dto/type-activite/update-type-activite.dto';
import { TypeActiviteDto } from '../../../../applications/dto/type-activite/type-activite-response.dto';
import { CreateTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/create-type-activite.usecase';
import { GetTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/get-type-activite.usecase';
import { UpdateTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/update-type-activite.usecase';
import { DeleteTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/delete-type-activite.usecase';

@Controller('typeactivites')
export class TypeActiviteController {
  constructor(
    private readonly createUseCase: CreateTypeActiviteUseCase,
    private readonly getUseCase: GetTypeActiviteUseCase,
    private readonly updateUseCase: UpdateTypeActiviteUseCase,
    private readonly deleteUseCase: DeleteTypeActiviteUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTypeActiviteDto): Promise<TypeActiviteDto> {
    const entity = await this.createUseCase.execute(dto);
    return new TypeActiviteDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<TypeActiviteDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new TypeActiviteDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TypeActiviteDto> {
    const entity = await this.getUseCase.execute(id);
    return new TypeActiviteDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTypeActiviteDto,
  ): Promise<TypeActiviteDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new TypeActiviteDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
