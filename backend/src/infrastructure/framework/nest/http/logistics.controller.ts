import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { CreateLabelDto } from '../../../../applications/dto/logistics/create-label.dto';
import { LabelResponseDto } from '../../../../applications/dto/logistics/label-response.dto';
import { GenerateLabelUseCase } from '../../../../applications/usecase/logistics/generate-label.usecase';
import { TrackShipmentUseCase } from '../../../../applications/usecase/logistics/track-shipment.usecase';
import { TrackingResponseDto } from '../../../../applications/dto/logistics/tracking-response.dto';
import { ValidateAddressDto } from '../../../../applications/dto/logistics/validate-address.dto';
import { ValidateAddressUseCase } from '../../../../applications/usecase/logistics/validate-address.usecase';
import { SimulatePricingDto } from '../../../../applications/dto/logistics/simulate-pricing.dto';
import { SimulatePricingUseCase } from '../../../../applications/usecase/logistics/simulate-pricing.usecase';

@Controller('logistics')
export class LogisticsController {
  constructor(
    private readonly generateLabelUseCase: GenerateLabelUseCase,
    private readonly trackShipmentUseCase: TrackShipmentUseCase,
    private readonly validateAddressUseCase: ValidateAddressUseCase,
    private readonly simulatePricingUseCase: SimulatePricingUseCase,
  ) {}

  @Roles({ roles: ['realm:logistique', 'realm:admin'] })
  @Post('labels')
  @HttpCode(HttpStatus.CREATED)
  async generateLabel(@Body() dto: CreateLabelDto): Promise<LabelResponseDto> {
    return await this.generateLabelUseCase.execute(dto);
  }

  @Roles({ roles: ['realm:logistique', 'realm:commercial', 'realm:user'] })
  @Get('tracking/:trackingNumber')
  async track(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<TrackingResponseDto> {
    return await this.trackShipmentUseCase.execute(trackingNumber);
  }

  @Roles({ roles: ['realm:logistique', 'realm:commercial', 'realm:user'] })
  @Get('track/:trackingNumber')
  async legacyTrack(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<TrackingResponseDto> {
    return await this.trackShipmentUseCase.execute(trackingNumber);
  }

  @Roles({ roles: ['realm:logistique', 'realm:admin'] })
  @Post('addresses/validate')
  async validateAddress(@Body() dto: ValidateAddressDto) {
    return await this.validateAddressUseCase.execute(dto);
  }

  @Roles({ roles: ['realm:logistique', 'realm:admin'] })
  @Post('pricing/simulate')
  async simulatePricing(@Body() dto: SimulatePricingDto) {
    return await this.simulatePricingUseCase.execute(dto);
  }
}
