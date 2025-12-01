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
import { CreateMembrePartenaireDto } from '../../../../applications/dto/membre-partenaire/create-membre-partenaire.dto';
import { UpdateMembrePartenaireDto } from '../../../../applications/dto/membre-partenaire/update-membre-partenaire.dto';
import { MembrePartenaireDto } from '../../../../applications/dto/membre-partenaire/membre-partenaire-response.dto';
import { CreateMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/create-membre-partenaire.usecase';
import { GetMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/get-membre-partenaire.usecase';
import { UpdateMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/update-membre-partenaire.usecase';
import { DeleteMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/delete-membre-partenaire.usecase';

@Controller('membrepartenaires')
export class MembrePartenaireController {
  constructor(
    private readonly createUseCase: CreateMembrePartenaireUseCase,
    private readonly getUseCase: GetMembrePartenaireUseCase,
    private readonly updateUseCase: UpdateMembrePartenaireUseCase,
    private readonly deleteUseCase: DeleteMembrePartenaireUseCase,
  ) {}

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateMembrePartenaireDto,
  ): Promise<MembrePartenaireDto> {
    const entity = await this.createUseCase.execute(dto);
    return new MembrePartenaireDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<MembrePartenaireDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new MembrePartenaireDto(e));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MembrePartenaireDto> {
    const entity = await this.getUseCase.execute(id);
    return new MembrePartenaireDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMembrePartenaireDto,
  ): Promise<MembrePartenaireDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new MembrePartenaireDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
