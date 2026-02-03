import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganisationEntity } from './entities/organisation.entity';
import { OrganisationService } from './organisation.service';
import { OrganisationController } from './organisation.controller';
import { AuthSyncModule } from '../../users/auth-sync/auth-sync.module';
import { RoleModule } from '../../users/role/role.module';
import { MembreCompteModule } from '../../users/membre-compte/membre-compte.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganisationEntity]),
    forwardRef(() => AuthSyncModule),
    forwardRef(() => RoleModule),
    forwardRef(() => MembreCompteModule),
  ],
  controllers: [OrganisationController],
  providers: [OrganisationService],
  exports: [OrganisationService],
})
export class OrganisationModule {}
