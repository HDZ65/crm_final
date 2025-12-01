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
import { CreateRolePermissionDto } from '../../../../applications/dto/role-permission/create-role-permission.dto';
import { UpdateRolePermissionDto } from '../../../../applications/dto/role-permission/update-role-permission.dto';
import { RolePermissionDto } from '../../../../applications/dto/role-permission/role-permission-response.dto';
import { CreateRolePermissionUseCase } from '../../../../applications/usecase/role-permission/create-role-permission.usecase';
import { GetRolePermissionUseCase } from '../../../../applications/usecase/role-permission/get-role-permission.usecase';
import { UpdateRolePermissionUseCase } from '../../../../applications/usecase/role-permission/update-role-permission.usecase';
import { DeleteRolePermissionUseCase } from '../../../../applications/usecase/role-permission/delete-role-permission.usecase';

@Controller('rolepermissions')
export class RolePermissionController {
  constructor(
    private readonly createUseCase: CreateRolePermissionUseCase,
    private readonly getUseCase: GetRolePermissionUseCase,
    private readonly updateUseCase: UpdateRolePermissionUseCase,
    private readonly deleteUseCase: DeleteRolePermissionUseCase,
  ) {}

  @Roles({ roles: ['realm:super-admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateRolePermissionDto,
  ): Promise<RolePermissionDto> {
    const entity = await this.createUseCase.execute(dto);
    return new RolePermissionDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Get()
  async findAll(): Promise<RolePermissionDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new RolePermissionDto(entity));
  }

  @Roles({ roles: ['realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RolePermissionDto> {
    const entity = await this.getUseCase.execute(id);
    return new RolePermissionDto(entity);
  }

  @Roles({ roles: ['realm:super-admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionDto,
  ): Promise<RolePermissionDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new RolePermissionDto(entity);
  }

  @Roles({ roles: ['realm:super-admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
