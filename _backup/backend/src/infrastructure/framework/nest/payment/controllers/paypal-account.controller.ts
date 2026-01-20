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
  CreatePaypalAccountDto,
  UpdatePaypalAccountDto,
  PaypalAccountResponseDto,
} from '../../../../../applications/dto/paypal-account';
import {
  CreatePaypalAccountUseCase,
  GetPaypalAccountUseCase,
  UpdatePaypalAccountUseCase,
  DeletePaypalAccountUseCase,
} from '../../../../../applications/usecase/paypal-account';

@ApiTags('PayPal Accounts')
@Controller('paypal-accounts')
export class PaypalAccountController {
  constructor(
    private readonly createUseCase: CreatePaypalAccountUseCase,
    private readonly getUseCase: GetPaypalAccountUseCase,
    private readonly updateUseCase: UpdatePaypalAccountUseCase,
    private readonly deleteUseCase: DeletePaypalAccountUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un compte PayPal pour une société' })
  @ApiResponse({
    status: 201,
    description: 'Compte PayPal créé avec succès',
    type: PaypalAccountResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Un compte PayPal existe déjà pour cette société' })
  async create(@Body() dto: CreatePaypalAccountDto): Promise<PaypalAccountResponseDto> {
    return this.createUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les comptes PayPal' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes PayPal',
    type: [PaypalAccountResponseDto],
  })
  async findAll(): Promise<PaypalAccountResponseDto[]> {
    return this.getUseCase.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lister les comptes PayPal actifs' })
  @ApiResponse({
    status: 200,
    description: 'Liste des comptes PayPal actifs',
    type: [PaypalAccountResponseDto],
  })
  async findAllActive(): Promise<PaypalAccountResponseDto[]> {
    return this.getUseCase.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un compte PayPal par ID' })
  @ApiParam({ name: 'id', description: 'ID du compte PayPal' })
  @ApiResponse({
    status: 200,
    description: 'Compte PayPal trouvé',
    type: PaypalAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte PayPal non trouvé' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<PaypalAccountResponseDto> {
    return this.getUseCase.findById(id);
  }

  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer le compte PayPal d\'une société' })
  @ApiParam({ name: 'societeId', description: 'ID de la société' })
  @ApiResponse({
    status: 200,
    description: 'Compte PayPal de la société',
    type: PaypalAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Aucun compte PayPal configuré pour cette société' })
  async findBySocieteId(
    @Param('societeId', ParseUUIDPipe) societeId: string,
  ): Promise<PaypalAccountResponseDto> {
    return this.getUseCase.findBySocieteId(societeId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un compte PayPal' })
  @ApiParam({ name: 'id', description: 'ID du compte PayPal' })
  @ApiResponse({
    status: 200,
    description: 'Compte PayPal mis à jour',
    type: PaypalAccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Compte PayPal non trouvé' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaypalAccountDto,
  ): Promise<PaypalAccountResponseDto> {
    return this.updateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un compte PayPal' })
  @ApiParam({ name: 'id', description: 'ID du compte PayPal' })
  @ApiResponse({ status: 204, description: 'Compte PayPal supprimé' })
  @ApiResponse({ status: 404, description: 'Compte PayPal non trouvé' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deleteUseCase.execute(id);
  }
}
