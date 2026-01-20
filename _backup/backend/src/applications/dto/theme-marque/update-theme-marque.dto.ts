import { PartialType } from '@nestjs/mapped-types';
import { CreateThemeMarqueDto } from './create-theme-marque.dto';

export class UpdateThemeMarqueDto extends PartialType(CreateThemeMarqueDto) {}
