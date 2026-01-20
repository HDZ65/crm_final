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
  CreateSlimpayAccountDto,
  UpdateSlimpayAccountDto,
  SlimpayAccountResponseDto,
} from '../../../../../applications/dto/slimpay-account';
import {
  CreateSlimpayAccountUseCase,
  GetSlimpayAccountUseCase,
  UpdateSlimpayAccountUseCase,
  DeleteSlimpayAccountUseCase,
} from '../../../../../applications/usecase/slimpay-account';

@ApiTags('Slimpay Accounts')
@Controller('slimpay-accounts')
export class SlimpayAccountController {
  constructor(
    private readonly createUseCase: CreateSlimpayAccountUseCase,
    private readonly getUseCase: GetSlimpayAccountUseCase,
    private readonly updateUseCase: UpdateSlimpayAccountUseCase,
    private readonly deleteUseCase: DeleteSlimpayAccountUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un compte Slimpay pour une société' })
  @ApiResponse({
    status: 201,
    description: 'Compte Slimpay créé avec succès',
    type: SlimpayAccountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Un compte Slimpay existe déjà pour cette société' })
  async create(@Body() dto: CreateSlimpayAccountDto): Promise<SlimpayAccountResponseDto> {
    return this.createUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les comptes Slimpay' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes Slimpay',
    type: [SlimpayAccountResponseDto],
  })
  async findAll(): Promise<SlimpayAccountResponseDto[]> {
    return this.getUseCase.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les comptes Slimpay actifs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes Slimpay actifs',
    type: [SlimpayAccountResponseDto],
  })
  async findAllActive(): Promise<SlimpayAccountResponseDto[]> {
    return this.getUseCase.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un compte Slimpay par ID' })
  @ApiParam({ name: 'id', description: 'ID du compte Slimpay' })
  @ApiResponse({
    status: 200,
    description: 'Compte Slimpay trouvé',
    type: SlimpayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte Slimpay non trouvé' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<SlimpayAccountResponseDto> {
    return this.getUseCase.findById(id);
  }

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer le compte Slimpay d\'une société' })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Compte Slimpay de la société',
    type: SlimpayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aucun compte Slimpay configuré pour cette société' })
  async findBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<SlimpayAccountResponseDto> {
    return this.getUseCase.findBySocieteId(societeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un compte Slimpay' })
  @ApiParam({ name: 'id', description: 'ID du compte Slimpay' })
  @ApiResponse({
    status: 200,
    description: 'Compte Slimpay mis à jour',
    type: SlimpayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte Slimpay non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSlimpayAccountDto,
  ): Promise<SlimpayAccountResponseDto> {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un compte Slimpay' })
  @ApiParam({ name: 'id', description: 'ID du compte Slimpay' })
  @ApiResponse({ status: 204, description: 'Compte Slimpay supprimé' })
  @ApiResponse({ status: 404, description: 'Compte Slimpay non trouvé' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUseCase.execute(id);
  }
}
