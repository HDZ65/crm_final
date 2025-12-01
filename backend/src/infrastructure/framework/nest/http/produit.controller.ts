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
import { CreateProduitDto } from '../../../../applications/dto/produit/create-produit.dto';
import { UpdateProduitDto } from '../../../../applications/dto/produit/update-produit.dto';
import { ProduitDto } from '../../../../applications/dto/produit/produit-response.dto';
import { CreateProduitUseCase } from '../../../../applications/usecase/produit/create-produit.usecase';
import { GetProduitUseCase } from '../../../../applications/usecase/produit/get-produit.usecase';
import { UpdateProduitUseCase } from '../../../../applications/usecase/produit/update-produit.usecase';
import { DeleteProduitUseCase } from '../../../../applications/usecase/produit/delete-produit.usecase';

@Controller('produits')
export class ProduitController {
  constructor(
    private readonly createUseCase: CreateProduitUseCase,
    private readonly getUseCase: GetProduitUseCase,
    private readonly updateUseCase: UpdateProduitUseCase,
    private readonly deleteUseCase: DeleteProduitUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProduitDto): Promise<ProduitDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ProduitDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<ProduitDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ProduitDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProduitDto> {
    const entity = await this.getUseCase.execute(id);
    return new ProduitDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProduitDto,
  ): Promise<ProduitDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ProduitDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
