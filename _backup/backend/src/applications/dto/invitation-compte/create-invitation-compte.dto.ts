import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateInvitationCompteDto {
  @IsString()
  @IsNotEmpty()
  organisationId: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  emailInvite: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  expireAt: string;

  @IsString()
  @IsNotEmpty()
  etat: string;
}
