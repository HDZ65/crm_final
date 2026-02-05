import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  OrganisationEntity,
  SocieteEntity,
  StatutPartenaireEntity,
  RolePartenaireEntity,
  ThemeMarqueEntity,
  PartenaireMarqueBlancheEntity,
  MembrePartenaireEntity,
} from './domain/organisations/entities';

// Infrastructure services
import {
  OrganisationService,
  SocieteService,
  StatutPartenaireService,
  RolePartenaireService,
  ThemeMarqueService,
  PartenaireMarqueBlancheService,
  MembrePartenaireService,
} from './infrastructure/persistence/typeorm/repositories/organisations';

// Interface controllers
import {
  OrganisationController,
  SocieteController,
  StatutPartenaireController,
  RolePartenaireController,
  ThemeMarqueController,
  PartenaireMarqueBlancheController,
  MembrePartenaireController,
} from './interfaces/grpc/controllers/organisations';

// Cross-context dependencies
import { UsersModule } from './users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganisationEntity,
      SocieteEntity,
      StatutPartenaireEntity,
      RolePartenaireEntity,
      ThemeMarqueEntity,
      PartenaireMarqueBlancheEntity,
      MembrePartenaireEntity,
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [
    OrganisationController,
    SocieteController,
    StatutPartenaireController,
    RolePartenaireController,
    ThemeMarqueController,
    PartenaireMarqueBlancheController,
    MembrePartenaireController,
  ],
  providers: [
    OrganisationService,
    SocieteService,
    StatutPartenaireService,
    RolePartenaireService,
    ThemeMarqueService,
    PartenaireMarqueBlancheService,
    MembrePartenaireService,
  ],
  exports: [
    OrganisationService,
    SocieteService,
    StatutPartenaireService,
    RolePartenaireService,
    ThemeMarqueService,
    PartenaireMarqueBlancheService,
    MembrePartenaireService,
  ],
})
export class OrganisationsModule {}
