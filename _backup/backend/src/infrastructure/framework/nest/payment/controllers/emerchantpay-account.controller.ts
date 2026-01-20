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
  CreateEmerchantpayAccountDto,
  UpdateEmerchantpayAccountDto,
  EmerchantpayAccountResponseDto,
} from '../../../../../applications/dto/emerchantpay-account';
import {
  CreateEmerchantpayAccountUseCase,
  GetEmerchantpayAccountUseCase,
  UpdateEmerchantpayAccountUseCase,
  DeleteEmerchantpayAccountUseCase,
} from '../../../../../applications/usecase/emerchantpay-account';

@ApiTags('Emerchantpay Accounts')
@Controller('emerchantpay-accounts')
export class EmerchantpayAccountController {
  constructor(
    private readonly createUseCase: CreateEmerchantpayAccountUseCase,
    private readonly getUseCase: GetEmerchantpayAccountUseCase,
    private readonly updateUseCase: UpdateEmerchantpayAccountUseCase,
    private readonly deleteUseCase: DeleteEmerchantpayAccountUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un compte Emerchantpay pour une société' })
  @ApiResponse({
    status: 201,
    description: 'Compte Emerchantpay créé avec succès',
    type: EmerchantpayAccountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Un compte Emerchantpay existe déjà pour cette société' })
  async create(@Body() dto: CreateEmerchantpayAccountDto): Promise<EmerchantpayAccountResponseDto> {
    return this.createUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les comptes Emerchantpay' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes Emerchantpay',
    type: [EmerchantpayAccountResponseDto],
  })
  async findAll(): Promise<EmerchantpayAccountResponseDto[]> {
    return this.getUseCase.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les comptes Emerchantpay actifs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes Emerchantpay actifs',
    type: [EmerchantpayAccountResponseDto],
  })
  async findAllActive(): Promise<EmerchantpayAccountResponseDto[]> {
    return this.getUseCase.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un compte Emerchantpay par ID' })
  @ApiParam({ name: 'id', description: 'ID du compte Emerchantpay' })
  @ApiResponse({
    status: 200,
    description: 'Compte Emerchantpay trouvé',
    type: EmerchantpayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte Emerchantpay non trouvé' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<EmerchantpayAccountResponseDto> {
    return this.getUseCase.findById(id);
  }

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer le compte Emerchantpay d\'une société' })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Compte Emerchantpay de la société',
    type: EmerchantpayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aucun compte Emerchantpay configuré pour cette société' })
  async findBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<EmerchantpayAccountResponseDto> {
    return this.getUseCase.findBySocieteId(societeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un compte Emerchantpay' })
  @ApiParam({ name: 'id', description: 'ID du compte Emerchantpay' })
  @ApiResponse({
    status: 200,
    description: 'Compte Emerchantpay mis à jour',
    type: EmerchantpayAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte Emerchantpay non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmerchantpayAccountDto,
  ): Promise<EmerchantpayAccountResponseDto> {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un compte Emerchantpay' })
  @ApiParam({ name: 'id', description: 'ID du compte Emerchantpay' })
  @ApiResponse({ status: 204, description: 'Compte Emerchantpay supprimé' })
  @ApiResponse({ status: 404, description: 'Compte Emerchantpay non trouvé' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUseCase.execute(id);
  }
}
