import { ApiProperty } from '@nestjs/swagger';

export class UserOrganisationDto {
  @ApiProperty({ description: 'Organisation ID' })
  id: string;

  @ApiProperty({ description: 'Organisation name' })
  nom: string;

  @ApiProperty({ description: 'User role in this organisation' })
  roleId: string;

  @ApiProperty({ description: 'Membership status' })
  etat: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Keycloak user ID' })
  keycloakId: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'Last name' })
  nom: string;

  @ApiProperty({ description: 'First name' })
  prenom: string;

  @ApiProperty({ description: 'Phone number' })
  telephone: string;

  @ApiProperty({ description: 'Is user active' })
  actif: boolean;

  @ApiProperty({
    description: 'List of organisations the user belongs to',
    type: [UserOrganisationDto],
  })
  organisations: UserOrganisationDto[];

  @ApiProperty({
    description: 'Whether user has at least one organisation - use this to redirect to organisation creation page',
  })
  hasOrganisation: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  constructor(partial: Partial<UserProfileResponseDto>) {
    Object.assign(this, partial);
  }
}
