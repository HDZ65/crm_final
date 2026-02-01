import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompteEntity } from './entities/compte.entity';
import { CompteService } from './compte.service';
import { CompteController } from './compte.controller';
import { AuthSyncModule } from '../auth-sync/auth-sync.module';
import { RoleModule } from '../role/role.module';
import { MembreCompteModule } from '../membre-compte/membre-compte.module';
import { OrganisationsClientModule } from '../organisations-client/organisations-client.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompteEntity]),
    forwardRef(() => AuthSyncModule),
    RoleModule,
    forwardRef(() => MembreCompteModule),
    OrganisationsClientModule,
  ],
  controllers: [CompteController],
  providers: [CompteService],
  exports: [CompteService],
})
export class CompteModule {}
