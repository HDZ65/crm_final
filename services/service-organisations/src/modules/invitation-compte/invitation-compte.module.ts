import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationCompte } from './entities/invitation-compte.entity';
import { InvitationCompteService } from './invitation-compte.service';

@Module({
  imports: [TypeOrmModule.forFeature([InvitationCompte])],
  providers: [InvitationCompteService],
  exports: [InvitationCompteService],
})
export class InvitationCompteModule {}
