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
import { CreateGroupeDto } from '../../../../applications/dto/groupe/create-groupe.dto';
import { UpdateGroupeDto } from '../../../../applications/dto/groupe/update-groupe.dto';
import { GroupeDto } from '../../../../applications/dto/groupe/groupe-response.dto';
import { CreateGroupeUseCase } from '../../../../applications/usecase/groupe/create-groupe.usecase';
import { GetGroupeUseCase } from '../../../../applications/usecase/groupe/get-groupe.usecase';
import { UpdateGroupeUseCase } from '../../../../applications/usecase/groupe/update-groupe.usecase';
import { DeleteGroupeUseCase } from '../../../../applications/usecase/groupe/delete-groupe.usecase';

@Controller('groupes')
export class GroupeController {
  constructor(
    private readonly createUseCase: CreateGroupeUseCase,
    private readonly getUseCase: GetGroupeUseCase,
    private readonly updateUseCase: UpdateGroupeUseCase,
    private readonly deleteUseCase: DeleteGroupeUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGroupeDto): Promise<GroupeDto> {
    const entity = await this.createUseCase.execute(dto);
    return new GroupeDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<GroupeDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new GroupeDto(entity));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GroupeDto> {
    const entity = await this.getUseCase.execute(id);
    return new GroupeDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupeDto,
  ): Promise<GroupeDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new GroupeDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
