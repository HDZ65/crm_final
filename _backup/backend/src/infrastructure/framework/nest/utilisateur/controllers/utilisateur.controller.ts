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
import { CreateUtilisateurDto } from '../../../../../applications/dto/utilisateur/create-utilisateur.dto';
import { UpdateUtilisateurDto } from '../../../../../applications/dto/utilisateur/update-utilisateur.dto';
import { UtilisateurDto } from '../../../../../applications/dto/utilisateur/utilisateur-response.dto';
import { CreateUtilisateurUseCase } from '../../../../../applications/usecase/utilisateur/create-utilisateur.usecase';
import { GetUtilisateurUseCase } from '../../../../../applications/usecase/utilisateur/get-utilisateur.usecase';
import { UpdateUtilisateurUseCase } from '../../../../../applications/usecase/utilisateur/update-utilisateur.usecase';
import { DeleteUtilisateurUseCase } from '../../../../../applications/usecase/utilisateur/delete-utilisateur.usecase';

@Controller('utilisateurs')
export class UtilisateurController {
  constructor(
    private readonly createUseCase: CreateUtilisateurUseCase,
    private readonly getUseCase: GetUtilisateurUseCase,
    private readonly updateUseCase: UpdateUtilisateurUseCase,
    private readonly deleteUseCase: DeleteUtilisateurUseCase,
  ) {}

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUtilisateurDto): Promise<UtilisateurDto> {
    const entity = await this.createUseCase.execute(dto);
    return new UtilisateurDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<UtilisateurDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new UtilisateurDto(e));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UtilisateurDto> {
    const entity = await this.getUseCase.execute(id);
    return new UtilisateurDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUtilisateurDto,
  ): Promise<UtilisateurDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new UtilisateurDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
