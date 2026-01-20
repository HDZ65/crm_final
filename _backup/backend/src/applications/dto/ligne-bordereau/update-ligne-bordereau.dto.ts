import { PartialType } from '@nestjs/mapped-types';
import { CreateLigneBordereauDto } from './create-ligne-bordereau.dto';
import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateLigneBordereauDto extends PartialType(
  CreateLigneBordereauDto,
) {
  @IsOptional()
  @IsIn(['selectionnee', 'deselectionnee', 'validee', 'rejetee'])
  statutLigne?: string;

  @IsOptional()
  @IsBoolean()
  selectionne?: boolean;

  @IsOptional()
  @IsString()
  motifDeselection?: string | null;

  @IsOptional()
  @IsString()
  validateurId?: string | null;
}
