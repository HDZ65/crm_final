import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAffectationGroupeClientDto {
  @IsString()
  @IsNotEmpty()
  groupeId: string;

  @IsString()
  @IsNotEmpty()
  clientBaseId: string;
}
