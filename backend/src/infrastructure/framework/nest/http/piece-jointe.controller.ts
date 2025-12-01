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
import { CreatePieceJointeDto } from '../../../../applications/dto/piece-jointe/create-piece-jointe.dto';
import { UpdatePieceJointeDto } from '../../../../applications/dto/piece-jointe/update-piece-jointe.dto';
import { PieceJointeDto } from '../../../../applications/dto/piece-jointe/piece-jointe-response.dto';
import { CreatePieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/create-piece-jointe.usecase';
import { GetPieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/get-piece-jointe.usecase';
import { UpdatePieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/update-piece-jointe.usecase';
import { DeletePieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/delete-piece-jointe.usecase';

@Controller('piecejointes')
export class PieceJointeController {
  constructor(
    private readonly createUseCase: CreatePieceJointeUseCase,
    private readonly getUseCase: GetPieceJointeUseCase,
    private readonly updateUseCase: UpdatePieceJointeUseCase,
    private readonly deleteUseCase: DeletePieceJointeUseCase,
  ) {}

  @Roles({ roles: ['realm:user'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePieceJointeDto): Promise<PieceJointeDto> {
    const entity = await this.createUseCase.execute(dto);
    return new PieceJointeDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Get()
  async findAll(): Promise<PieceJointeDto[]> {
    const entities = await this.getUseCase.executeAll();
    return entities.map((e) => new PieceJointeDto(e));
  }

  @Roles({ roles: ['realm:user'] })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PieceJointeDto> {
    const entity = await this.getUseCase.execute(id);
    return new PieceJointeDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePieceJointeDto,
  ): Promise<PieceJointeDto> {
    const entity = await this.updateUseCase.execute(id, dto);
    return new PieceJointeDto(entity);
  }

  @Roles({ roles: ['realm:user'] })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
