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
  CreateStripeAccountDto,
  UpdateStripeAccountDto,
  StripeAccountResponseDto,
} from '../../../../../applications/dto/stripe-account';
import {
  CreateStripeAccountUseCase,
  GetStripeAccountUseCase,
  UpdateStripeAccountUseCase,
  DeleteStripeAccountUseCase,
} from '../../../../../applications/usecase/stripe-account';

@ApiTags('Stripe Accounts')
@Controller('stripe-accounts')
export class StripeAccountController {
  constructor(
    private readonly createUseCase: CreateStripeAccountUseCase,
    private readonly getUseCase: GetStripeAccountUseCase,
    private readonly updateUseCase: UpdateStripeAccountUseCase,
    private readonly deleteUseCase: DeleteStripeAccountUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un compte Stripe pour une société' })
  @ApiResponse({
    status: 201,
    description: 'Compte Stripe créé avec succès',
    type: StripeAccountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Un compte Stripe existe déjà pour cette société' })
  async create(@Body() dto: CreateStripeAccountDto): Promise<StripeAccountResponseDto> {
    return this.createUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les comptes Stripe' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes Stripe',
    type: [StripeAccountResponseDto],
  })
  async findAll(): Promise<StripeAccountResponseDto[]> {
    return this.getUseCase.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les comptes Stripe actifs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes Stripe actifs',
    type: [StripeAccountResponseDto],
  })
  async findAllActive(): Promise<StripeAccountResponseDto[]> {
    return this.getUseCase.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un compte Stripe par ID' })
  @ApiParam({ name: 'id', description: 'ID du compte Stripe' })
  @ApiResponse({
    status: 200,
    description: 'Compte Stripe trouvé',
    type: StripeAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte Stripe non trouvé' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<StripeAccountResponseDto> {
    return this.getUseCase.findById(id);
  }

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer le compte Stripe d\'une société' })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Compte Stripe de la société',
    type: StripeAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aucun compte Stripe configuré pour cette société' })
  async findBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<StripeAccountResponseDto> {
    return this.getUseCase.findBySocieteId(societeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un compte Stripe' })
  @ApiParam({ name: 'id', description: 'ID du compte Stripe' })
  @ApiResponse({
    status: 200,
    description: 'Compte Stripe mis à jour',
    type: StripeAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte Stripe non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStripeAccountDto,
  ): Promise<StripeAccountResponseDto> {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un compte Stripe' })
  @ApiParam({ name: 'id', description: 'ID du compte Stripe' })
  @ApiResponse({ status: 204, description: 'Compte Stripe supprimé' })
  @ApiResponse({ status: 404, description: 'Compte Stripe non trouvé' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUseCase.execute(id);
  }
}
