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
import { Roles, Public } from 'nest-keycloak-connect';
import { CreateRoleDto } from '../../../../../applications/dto/role/create-role.dto';
import { UpdateRoleDto } from '../../../../../applications/dto/role/update-role.dto';
import { RoleDto } from '../../../../../applications/dto/role/role-response.dto';
import { CreateRoleUseCase } from '../../../../../applications/usecase/role/create-role.usecase';
import { GetRoleUseCase } from '../../../../../applications/usecase/role/get-role.usecase';
import { UpdateRoleUseCase } from '../../../../../applications/usecase/role/update-role.usecase';
import { DeleteRoleUseCase } from '../../../../../applications/usecase/role/delete-role.usecase';

@Controller('roles')
export class RoleController {
  constructor(
    private readonly createUseCase: CreateRoleUseCase,
    private readonly getUseCase: GetRoleUseCase,
    private readonly updateUseCase: UpdateRoleUseCase,
    private readonly deleteUseCase: DeleteRoleUseCase,
  ) {}

  @Roles({ roles: ['realm:super-admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRoleDto): Promise<RoleDto> {
    const entity = await this.createUseCase.execute(dto);
    return new RoleDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Get()
  async findAll(): Promise<RoleDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new RoleDto(e));
  }

  @Public()
  @Get('organisation-roles')
  async findOrganisationRoles(): Promise<RoleDto[]> {
    const entities = await this.getUseCase.executeAll();
    // Retourne uniquement les rôles assignables (pas owner)
    return entities
      .filter((e) => e.code !== 'owner')
      .map((e) => new RoleDto(e));
  }

  @Roles({ roles: ['realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RoleDto> {
    const entity = await this.getUseCase.execute(id);
    return new RoleDto(entity);
  }

  @Roles({ roles: ['realm:super-admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new RoleDto(entity);
  }

  @Roles({ roles: ['realm:super-admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
