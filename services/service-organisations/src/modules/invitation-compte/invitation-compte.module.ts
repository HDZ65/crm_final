import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationCompte } from './entities/invitation-compte.entity';
import { InvitationCompteService } from './invitation-compte.service';
import { InvitationCompteController } from './invitation-compte.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InvitationCompte])],
  controllers: [InvitationCompteController],
  providers: [InvitationCompteService],
  exports: [InvitationCompteService],
})
export class InvitationCompteModule {}
