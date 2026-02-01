import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganisationEntity } from './entities/organisation.entity';
import { OrganisationService } from './organisation.service';
import { OrganisationController } from './organisation.controller';
import { UsersClientModule } from '../../grpc-clients/users-client.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrganisationEntity]), UsersClientModule],
  controllers: [OrganisationController],
  providers: [OrganisationService],
  exports: [OrganisationService],
})
export class OrganisationModule {}
