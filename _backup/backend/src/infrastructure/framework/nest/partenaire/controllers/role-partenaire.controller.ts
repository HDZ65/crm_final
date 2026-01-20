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
import { CreateRolePartenaireDto } from '../../../../../applications/dto/role-partenaire/create-role-partenaire.dto';
import { UpdateRolePartenaireDto } from '../../../../../applications/dto/role-partenaire/update-role-partenaire.dto';
import { RolePartenaireDto } from '../../../../../applications/dto/role-partenaire/role-partenaire-response.dto';
import { CreateRolePartenaireUseCase } from '../../../../../applications/usecase/role-partenaire/create-role-partenaire.usecase';
import { GetRolePartenaireUseCase } from '../../../../../applications/usecase/role-partenaire/get-role-partenaire.usecase';
import { UpdateRolePartenaireUseCase } from '../../../../../applications/usecase/role-partenaire/update-role-partenaire.usecase';
import { DeleteRolePartenaireUseCase } from '../../../../../applications/usecase/role-partenaire/delete-role-partenaire.usecase';

@Controller('rolepartenaires')
export class RolePartenaireController {
  constructor(
    private readonly createUseCase: CreateRolePartenaireUseCase,
    private readonly getUseCase: GetRolePartenaireUseCase,
    private readonly updateUseCase: UpdateRolePartenaireUseCase,
    private readonly deleteUseCase: DeleteRolePartenaireUseCase,
  ) {}

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateRolePartenaireDto,
  ): Promise<RolePartenaireDto> {
    const entity = await this.createUseCase.execute(dto);
    return new RolePartenaireDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<RolePartenaireDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new RolePartenaireDto(e));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RolePartenaireDto> {
    const entity = await this.getUseCase.execute(id);
    return new RolePartenaireDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRolePartenaireDto,
  ): Promise<RolePartenaireDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new RolePartenaireDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
