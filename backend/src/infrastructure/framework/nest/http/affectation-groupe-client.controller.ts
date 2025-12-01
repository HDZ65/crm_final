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
import { CreateAffectationGroupeClientDto } from '../../../../applications/dto/affectation-groupe-client/create-affectation-groupe-client.dto';
import { UpdateAffectationGroupeClientDto } from '../../../../applications/dto/affectation-groupe-client/update-affectation-groupe-client.dto';
import { AffectationGroupeClientDto } from '../../../../applications/dto/affectation-groupe-client/affectation-groupe-client-response.dto';
import { CreateAffectationGroupeClientUseCase } from '../../../../applications/usecase/affectation-groupe-client/create-affectation-groupe-client.usecase';
import { GetAffectationGroupeClientUseCase } from '../../../../applications/usecase/affectation-groupe-client/get-affectation-groupe-client.usecase';
import { UpdateAffectationGroupeClientUseCase } from '../../../../applications/usecase/affectation-groupe-client/update-affectation-groupe-client.usecase';
import { DeleteAffectationGroupeClientUseCase } from '../../../../applications/usecase/affectation-groupe-client/delete-affectation-groupe-client.usecase';

@Controller('affectationgroupeclients')
export class AffectationGroupeClientController {
  constructor(
    private readonly createUseCase: CreateAffectationGroupeClientUseCase,
    private readonly getUseCase: GetAffectationGroupeClientUseCase,
    private readonly updateUseCase: UpdateAffectationGroupeClientUseCase,
    private readonly deleteUseCase: DeleteAffectationGroupeClientUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAffectationGroupeClientDto,
  ): Promise<AffectationGroupeClientDto> {
    const entity = await this.createUseCase.execute(dto);
    return new AffectationGroupeClientDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<AffectationGroupeClientDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((entity) => new AffectationGroupeClientDto(entity));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AffectationGroupeClientDto> {
    const entity = await this.getUseCase.execute(id);
    return new AffectationGroupeClientDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAffectationGroupeClientDto,
  ): Promise<AffectationGroupeClientDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new AffectationGroupeClientDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
