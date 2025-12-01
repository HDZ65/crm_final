import { IsNotEmpty, IsString } from 'class-validator';

export class CreateThemeMarqueDto {
  @IsString()
  @IsNotEmpty()
  logoUrl: string;

  @IsString()
  @IsNotEmpty()
  couleurPrimaire: string;

  @IsString()
  @IsNotEmpty()
  couleurSecondaire: string;

  @IsString()
  @IsNotEmpty()
  faviconUrl: string;
}
