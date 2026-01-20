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
import { CreateAdresseDto } from '../../../../../applications/dto/adresse/create-adresse.dto';
import { UpdateAdresseDto } from '../../../../../applications/dto/adresse/update-adresse.dto';
import { AdresseDto } from '../../../../../applications/dto/adresse/adresse-response.dto';
import { CreateAdresseUseCase } from '../../../../../applications/usecase/adresse/create-adresse.usecase';
import { GetAdresseUseCase } from '../../../../../applications/usecase/adresse/get-adresse.usecase';
import { UpdateAdresseUseCase } from '../../../../../applications/usecase/adresse/update-adresse.usecase';
import { DeleteAdresseUseCase } from '../../../../../applications/usecase/adresse/delete-adresse.usecase';

@Controller('adresses')
export class AdresseController {
  constructor(
    private readonly createUseCase: CreateAdresseUseCase,
    private readonly getUseCase: GetAdresseUseCase,
    private readonly updateUseCase: UpdateAdresseUseCase,
    private readonly deleteUseCase: DeleteAdresseUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAdresseDto): Promise<AdresseDto> {
    const entity = await this.createUseCase.execute(dto);
    return new AdresseDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<AdresseDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new AdresseDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AdresseDto> {
    const entity = await this.getUseCase.execute(id);
    return new AdresseDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAdresseDto,
  ): Promise<AdresseDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new AdresseDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
