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
import { CreatePartenaireMarqueBlancheDto } from '../../../../../applications/dto/partenaire-marque-blanche/create-partenaire-marque-blanche.dto';
import { UpdatePartenaireMarqueBlancheDto } from '../../../../../applications/dto/partenaire-marque-blanche/update-partenaire-marque-blanche.dto';
import { PartenaireMarqueBlancheDto } from '../../../../../applications/dto/partenaire-marque-blanche/partenaire-marque-blanche-response.dto';
import { CreatePartenaireMarqueBlancheUseCase } from '../../../../../applications/usecase/partenaire-marque-blanche/create-partenaire-marque-blanche.usecase';
import { GetPartenaireMarqueBlancheUseCase } from '../../../../../applications/usecase/partenaire-marque-blanche/get-partenaire-marque-blanche.usecase';
import { UpdatePartenaireMarqueBlancheUseCase } from '../../../../../applications/usecase/partenaire-marque-blanche/update-partenaire-marque-blanche.usecase';
import { DeletePartenaireMarqueBlancheUseCase } from '../../../../../applications/usecase/partenaire-marque-blanche/delete-partenaire-marque-blanche.usecase';

@Controller('partenairemarqueblanches')
export class PartenaireMarqueBlancheController {
  constructor(
    private readonly createUseCase: CreatePartenaireMarqueBlancheUseCase,
    private readonly getUseCase: GetPartenaireMarqueBlancheUseCase,
    private readonly updateUseCase: UpdatePartenaireMarqueBlancheUseCase,
    private readonly deleteUseCase: DeletePartenaireMarqueBlancheUseCase,
  ) {}

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePartenaireMarqueBlancheDto,
  ): Promise<PartenaireMarqueBlancheDto> {
    const entity = await this.createUseCase.execute(dto);
    return new PartenaireMarqueBlancheDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<PartenaireMarqueBlancheDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new PartenaireMarqueBlancheDto(e));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PartenaireMarqueBlancheDto> {
    const entity = await this.getUseCase.execute(id);
    return new PartenaireMarqueBlancheDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePartenaireMarqueBlancheDto,
  ): Promise<PartenaireMarqueBlancheDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new PartenaireMarqueBlancheDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
