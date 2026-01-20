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
  Query,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateBoiteMailDto } from '../../../../../applications/dto/boite-mail/create-boite-mail.dto';
import { UpdateBoiteMailDto } from '../../../../../applications/dto/boite-mail/update-boite-mail.dto';
import { BoiteMailDto } from '../../../../../applications/dto/boite-mail/boite-mail-response.dto';
import { CreateBoiteMailUseCase } from '../../../../../applications/usecase/boite-mail/create-boite-mail.usecase';
import { GetBoiteMailUseCase } from '../../../../../applications/usecase/boite-mail/get-boite-mail.usecase';
import { UpdateBoiteMailUseCase } from '../../../../../applications/usecase/boite-mail/update-boite-mail.usecase';
import { DeleteBoiteMailUseCase } from '../../../../../applications/usecase/boite-mail/delete-boite-mail.usecase';

@ApiTags('Boîtes Mail')
@Controller('boites-mail')
export class BoiteMailController {
  constructor(
    private readonly createUseCase: CreateBoiteMailUseCase,
    private readonly getUseCase: GetBoiteMailUseCase,
    private readonly updateUseCase: UpdateBoiteMailUseCase,
    private readonly deleteUseCase: DeleteBoiteMailUseCase,
  ) {}

  @Roles({ roles: ['realm:user'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle boîte mail' })
  @ApiResponse({
    status: 201,
    description: 'La boîte mail a été créée avec succès',
  })
  async create(@Body() dto: CreateBoiteMailDto): Promise<BoiteMailDto> {
    const entity = await this.createUseCase.execute(dto);
    return new BoiteMailDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les boîtes mail' })
  async findAll(
    @Query('utilisateurId') utilisateurId?: string,
  ): Promise<BoiteMailDto[]> {
    const entities = utilisateurId
      ? await this.getUseCase.executeByUtilisateurId(utilisateurId)
      : await this.getUseCase.executeAll();

    return entities.map((e) => new BoiteMailDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get('default/:utilisateurId')
  @ApiOperation({
    summary: "Récupérer la boîte mail par défaut d'un utilisateur",
  })
  async findDefault(
    @Param('utilisateurId') utilisateurId: string,
  ): Promise<BoiteMailDto | null> {
    const entity =
      await this.getUseCase.executeDefaultByUtilisateurId(utilisateurId);
    return entity ? new BoiteMailDto(entity) : null;
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une boîte mail par ID' })
  async findOne(@Param('id') id: string): Promise<BoiteMailDto> {
    const entity = await this.getUseCase.execute(id);
    return new BoiteMailDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une boîte mail' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBoiteMailDto,
  ): Promise<BoiteMailDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new BoiteMailDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une boîte mail' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
