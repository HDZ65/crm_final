import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganisationEntity } from './entities/organisation.entity';
import { OrganisationService } from './organisation.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrganisationEntity])],
  providers: [OrganisationService],
  exports: [OrganisationService],
})
export class OrganisationModule {}
