import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import {
  CreateGoCardlessAccountDto,
  UpdateGoCardlessAccountDto,
  GoCardlessAccountResponseDto,
} from '../../../../../applications/dto/gocardless-account';
import {
  CreateGoCardlessAccountUseCase,
  GetGoCardlessAccountUseCase,
  UpdateGoCardlessAccountUseCase,
  DeleteGoCardlessAccountUseCase,
} from '../../../../../applications/usecase/gocardless-account';

@ApiTags('GoCardless Accounts')
@Controller('gocardless-accounts')
export class GoCardlessAccountController {
  constructor(
    private readonly createUseCase: CreateGoCardlessAccountUseCase,
    private readonly getUseCase: GetGoCardlessAccountUseCase,
    private readonly updateUseCase: UpdateGoCardlessAccountUseCase,
    private readonly deleteUseCase: DeleteGoCardlessAccountUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un compte GoCardless pour une société' })
  @ApiResponse({
    status: 201,
    description: 'Compte GoCardless créé avec succès',
    type: GoCardlessAccountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Un compte GoCardless existe déjà pour cette société' })
  async create(@Body() dto: CreateGoCardlessAccountDto): Promise<GoCardlessAccountResponseDto> {
    return this.createUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les comptes GoCardless' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes GoCardless',
    type: [GoCardlessAccountResponseDto],
  })
  async findAll(): Promise<GoCardlessAccountResponseDto[]> {
    return this.getUseCase.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les comptes GoCardless actifs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes GoCardless actifs',
    type: [GoCardlessAccountResponseDto],
  })
  async findAllActive(): Promise<GoCardlessAccountResponseDto[]> {
    return this.getUseCase.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un compte GoCardless par ID' })
  @ApiParam({ name: 'id', description: 'ID du compte GoCardless' })
  @ApiResponse({
    status: 200,
    description: 'Compte GoCardless trouvé',
    type: GoCardlessAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte GoCardless non trouvé' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<GoCardlessAccountResponseDto> {
    return this.getUseCase.findById(id);
  }

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer le compte GoCardless d\'une société' })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Compte GoCardless de la société',
    type: GoCardlessAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aucun compte GoCardless configuré pour cette société' })
  async findBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<GoCardlessAccountResponseDto> {
    return this.getUseCase.findBySocieteId(societeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un compte GoCardless' })
  @ApiParam({ name: 'id', description: 'ID du compte GoCardless' })
  @ApiResponse({
    status: 200,
    description: 'Compte GoCardless mis à jour',
    type: GoCardlessAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte GoCardless non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoCardlessAccountDto,
  ): Promise<GoCardlessAccountResponseDto> {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un compte GoCardless' })
  @ApiParam({ name: 'id', description: 'ID du compte GoCardless' })
  @ApiResponse({ status: 204, description: 'Compte GoCardless supprimé' })
  @ApiResponse({ status: 404, description: 'Compte GoCardless non trouvé' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUseCase.execute(id);
  }
}
