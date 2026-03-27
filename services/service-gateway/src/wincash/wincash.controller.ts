import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { WincashGrpcClient } from '../grpc/wincash-grpc.client';

@ApiTags('Wincash')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/wincash')
export class WincashController {
  constructor(private readonly wincashClient: WincashGrpcClient) {}

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize cashback operations from WinCash' })
  syncCashback(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.wincashClient.syncCashback(body));
  }

  @Get('operations/:id')
  @ApiOperation({ summary: 'Get a cashback operation by ID' })
  getOperation(@Param('id') id: string) {
    return firstValueFrom(this.wincashClient.getOperation({ id }));
  }

  @Get('operations')
  @ApiOperation({ summary: 'List cashback operations' })
  listOperations(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.wincashClient.listOperations(query));
  }
}
