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
  CreateMultisafepayAccountDto,
  UpdateMultisafepayAccountDto,
  MultisafepayAccountResponseDto,
} from '../../../../../applications/dto/multisafepay-account';
import {
  CreateMultisafepayAccountUseCase,
  GetMultisafepayAccountUseCase,
  UpdateMultisafepayAccountUseCase,
  DeleteMultisafepayAccountUseCase,
} from '../../../../../applications/usecase/multisafepay-account';

@ApiTags('MultiSafepay Accounts')
@Controller('multisafepay-accounts')
export class MultisafepayAccountController {
  constructor(
    private readonly createUseCase: CreateMultisafepayAccountUseCase,
    private readonly getUseCase: GetMultisafepayAccountUseCase,
    private readonly updateUseCase: UpdateMultisafepayAccountUseCase,
    private readonly deleteUseCase: DeleteMultisafepayAccountUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un compte MultiSafepay pour une société' })
  @ApiResponse({
    status: 201,
    description: 'Compte MultiSafepay créé avec succès',
    type: MultisafepayAccountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Un compte MultiSafepay existe déjà pour cette société' })
  async create(@Body() dto: CreateMultisafepayAccountDto): Promise<MultisafepayAccountResponseDto> {
    return this.createUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les comptes MultiSafepay' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes MultiSafepay',
    type: [MultisafepayAccountResponseDto],
  })
  async findAll(): Promise<MultisafepayAccountResponseDto[]> {
    return this.getUseCase.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les comptes MultiSafepay actifs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes MultiSafepay actifs',
    type: [MultisafepayAccountResponseDto],
  })
  async findAllActive(): Promise<MultisafepayAccountResponseDto[]> {
    return this.getUseCase.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un compte MultiSafepay par ID' })
  @ApiParam({ name: 'id', description: 'ID du compte MultiSafepay' })
  @ApiResponse({
    status: 200,
    description: 'Compte MultiSafepay trouvé',
    type: MultisafepayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte MultiSafepay non trouvé' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<MultisafepayAccountResponseDto> {
    return this.getUseCase.findById(id);
  }

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer le compte MultiSafepay d\'une société' })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Compte MultiSafepay de la société',
    type: MultisafepayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aucun compte MultiSafepay configuré pour cette société' })
  async findBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<MultisafepayAccountResponseDto> {
    return this.getUseCase.findBySocieteId(societeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un compte MultiSafepay' })
  @ApiParam({ name: 'id', description: 'ID du compte MultiSafepay' })
  @ApiResponse({
    status: 200,
    description: 'Compte MultiSafepay mis à jour',
    type: MultisafepayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte MultiSafepay non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMultisafepayAccountDto,
  ): Promise<MultisafepayAccountResponseDto> {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un compte MultiSafepay' })
  @ApiParam({ name: 'id', description: 'ID du compte MultiSafepay' })
  @ApiResponse({ status: 204, description: 'Compte MultiSafepay supprimé' })
  @ApiResponse({ status: 404, description: 'Compte MultiSafepay non trouvé' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUseCase.execute(id);
  }
}
