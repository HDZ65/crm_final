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
import { CreateThemeMarqueDto } from '../../../../applications/dto/theme-marque/create-theme-marque.dto';
import { UpdateThemeMarqueDto } from '../../../../applications/dto/theme-marque/update-theme-marque.dto';
import { ThemeMarqueDto } from '../../../../applications/dto/theme-marque/theme-marque-response.dto';
import { CreateThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/create-theme-marque.usecase';
import { GetThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/get-theme-marque.usecase';
import { UpdateThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/update-theme-marque.usecase';
import { DeleteThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/delete-theme-marque.usecase';

@Controller('thememarques')
export class ThemeMarqueController {
  constructor(
    private readonly createUseCase: CreateThemeMarqueUseCase,
    private readonly getUseCase: GetThemeMarqueUseCase,
    private readonly updateUseCase: UpdateThemeMarqueUseCase,
    private readonly deleteUseCase: DeleteThemeMarqueUseCase,
  ) {}

  @Roles({ roles: ['realm:admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateThemeMarqueDto): Promise<ThemeMarqueDto> {
    const entity = await this.createUseCase.execute(dto);
    return new ThemeMarqueDto(entity);
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get()
  async findAll(): Promise<ThemeMarqueDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new ThemeMarqueDto(e));
  }

  @Roles({ roles: ['realm:manager', 'realm:admin'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ThemeMarqueDto> {
    const entity = await this.getUseCase.execute(id);
    return new ThemeMarqueDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateThemeMarqueDto,
  ): Promise<ThemeMarqueDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new ThemeMarqueDto(entity);
  }

  @Roles({ roles: ['realm:admin'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
