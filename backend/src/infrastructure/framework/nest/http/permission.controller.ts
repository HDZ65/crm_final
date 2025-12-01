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
import { CreatePermissionDto } from '../../../../applications/dto/permission/create-permission.dto';
import { UpdatePermissionDto } from '../../../../applications/dto/permission/update-permission.dto';
import { PermissionDto } from '../../../../applications/dto/permission/permission-response.dto';
import { CreatePermissionUseCase } from '../../../../applications/usecase/permission/create-permission.usecase';
import { GetPermissionUseCase } from '../../../../applications/usecase/permission/get-permission.usecase';
import { UpdatePermissionUseCase } from '../../../../applications/usecase/permission/update-permission.usecase';
import { DeletePermissionUseCase } from '../../../../applications/usecase/permission/delete-permission.usecase';

@Controller('permissions')
export class PermissionController {
  constructor(
    private readonly createUseCase: CreatePermissionUseCase,
    private readonly getUseCase: GetPermissionUseCase,
    private readonly updateUseCase: UpdatePermissionUseCase,
    private readonly deleteUseCase: DeletePermissionUseCase,
  ) {}

  @Roles({ roles: ['realm:super-admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionDto> {
    const entity = await this.createUseCase.execute(dto);
    return new PermissionDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Get()
  async findAll(): Promise<PermissionDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new PermissionDto(entity));
  }

  @Roles({ roles: ['realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PermissionDto> {
    const entity = await this.getUseCase.execute(id);
    return new PermissionDto(entity);
  }

  @Roles({ roles: ['realm:super-admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new PermissionDto(entity);
  }

  @Roles({ roles: ['realm:super-admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
