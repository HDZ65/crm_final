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
import { CreateConditionPaiementDto } from '../../../../../applications/dto/condition-paiement/create-condition-paiement.dto';
import { UpdateConditionPaiementDto } from '../../../../../applications/dto/condition-paiement/update-condition-paiement.dto';
import { ConditionPaiementDto } from '../../../../../applications/dto/condition-paiement/condition-paiement-response.dto';
import { CreateConditionPaiementUseCase } from '../../../../../applications/usecase/condition-paiement/create-condition-paiement.usecase';
import { GetConditionPaiementUseCase } from '../../../../../applications/usecase/condition-paiement/get-condition-paiement.usecase';
import { UpdateConditionPaiementUseCase } from '../../../../../applications/usecase/condition-paiement/update-condition-paiement.usecase';
import { DeleteConditionPaiementUseCase } from '../../../../../applications/usecase/condition-paiement/delete-condition-paiement.usecase';

@Controller('conditionpaiements')
export class ConditionPaiementController {
  constructor(
    private readonly createUseCase: CreateConditionPaiementUseCase,
    private readonly getUseCase: GetConditionPaiementUseCase,
    private readonly updateUseCase: UpdateConditionPaiementUseCase,
    private readonly deleteUseCase: DeleteConditionPaiementUseCase,
  ) {}

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateConditionPaiementDto,
  ): Promise<ConditionPaiementDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ConditionPaiementDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<ConditionPaiementDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ConditionPaiementDto(e));
  }

  @Roles({ roles: ['realm:comptable', 'realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ConditionPaiementDto> {
    const entity = await this.getUseCase.execute(id);
    return new ConditionPaiementDto(entity);
  }

  @Roles({ roles: ['realm:comptable', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateConditionPaiementDto,
  ): Promise<ConditionPaiementDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ConditionPaiementDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
