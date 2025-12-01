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
import { CreatePrixProduitDto } from '../../../../applications/dto/prix-produit/create-prix-produit.dto';
import { UpdatePrixProduitDto } from '../../../../applications/dto/prix-produit/update-prix-produit.dto';
import { PrixProduitDto } from '../../../../applications/dto/prix-produit/prix-produit-response.dto';
import { CreatePrixProduitUseCase } from '../../../../applications/usecase/prix-produit/create-prix-produit.usecase';
import { GetPrixProduitUseCase } from '../../../../applications/usecase/prix-produit/get-prix-produit.usecase';
import { UpdatePrixProduitUseCase } from '../../../../applications/usecase/prix-produit/update-prix-produit.usecase';
import { DeletePrixProduitUseCase } from '../../../../applications/usecase/prix-produit/delete-prix-produit.usecase';

@Controller('prixproduits')
export class PrixProduitController {
  constructor(
    private readonly createUseCase: CreatePrixProduitUseCase,
    private readonly getUseCase: GetPrixProduitUseCase,
    private readonly updateUseCase: UpdatePrixProduitUseCase,
    private readonly deleteUseCase: DeletePrixProduitUseCase,
  ) {}

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePrixProduitDto): Promise<PrixProduitDto> {
    const entity = await this.createUseCase.execute(dto);
    return new PrixProduitDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get()
  async findAll(): Promise<PrixProduitDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new PrixProduitDto(e));
  }

  @Roles({ roles: ['realm:commercial', 'realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PrixProduitDto> {
    const entity = await this.getUseCase.execute(id);
    return new PrixProduitDto(entity);
  }

  @Roles({ roles: ['realm:commercial', 'realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePrixProduitDto,
  ): Promise<PrixProduitDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new PrixProduitDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
