import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationCompteEntity } from './entities/invitation-compte.entity';
import { InvitationCompteService } from './invitation-compte.service';
import { InvitationCompteController } from './invitation-compte.controller';
import { AuthSyncModule } from '../auth-sync/auth-sync.module';
import { MembreCompteModule } from '../membre-compte/membre-compte.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InvitationCompteEntity]),
    forwardRef(() => AuthSyncModule),
    forwardRef(() => MembreCompteModule),
  ],
  controllers: [InvitationCompteController],
  providers: [InvitationCompteService],
  exports: [InvitationCompteService],
})
export class InvitationCompteModule {}
