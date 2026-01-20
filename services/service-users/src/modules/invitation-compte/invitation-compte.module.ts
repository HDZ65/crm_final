import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationCompteEntity } from './entities/invitation-compte.entity';
import { InvitationCompteService } from './invitation-compte.service';

@Module({
  imports: [TypeOrmModule.forFeature([InvitationCompteEntity])],
  providers: [InvitationCompteService],
  exports: [InvitationCompteService],
})
export class InvitationCompteModule {}
