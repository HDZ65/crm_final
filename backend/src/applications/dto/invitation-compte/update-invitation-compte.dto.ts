import { PartialType } from '@nestjs/mapped-types';
import { CreateInvitationCompteDto } from './create-invitation-compte.dto';

export class UpdateInvitationCompteDto extends PartialType(
  CreateInvitationCompteDto,
) {}
