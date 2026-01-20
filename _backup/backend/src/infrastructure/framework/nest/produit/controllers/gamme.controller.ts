import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from 'nest-keycloak-connect';
import { CreateGammeDto } from '../../../../../applications/dto/gamme/create-gamme.dto';
import { UpdateGammeDto } from '../../../../../applications/dto/gamme/update-gamme.dto';
import { GammeDto } from '../../../../../applications/dto/gamme/gamme-response.dto';
import { CreateGammeUseCase } from '../../../../../applications/usecase/gamme/create-gamme.usecase';
import { GetGammeUseCase } from '../../../../../applications/usecase/gamme/get-gamme.usecase';
import { UpdateGammeUseCase } from '../../../../../applications/usecase/gamme/update-gamme.usecase';
import { DeleteGammeUseCase } from '../../../../../applications/usecase/gamme/delete-gamme.usecase';

@Controller('gammes')
export class GammeController {
  constructor(
    private readonly createUseCase: CreateGammeUseCase,
    private readonly getUseCase: GetGammeUseCase,
    private readonly updateUseCase: UpdateGammeUseCase,
    private readonly deleteUseCase: DeleteGammeUseCase,
  ) {}

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGammeDto): Promise<GammeDto> {
    const entity = await this.createUseCase.execute(dto);
    return new GammeDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(@Query('societeId') societeId?: string): Promise<GammeDto[]> {
    const entities = societeId
      ? await this.getUseCase.executeBySocieteId(societeId)
      : await this.getUseCase.executeAll();
    return entities.map((e) => new GammeDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GammeDto> {
    const entity = await this.getUseCase.execute(id);
    return new GammeDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGammeDto,
  ): Promise<GammeDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new GammeDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
