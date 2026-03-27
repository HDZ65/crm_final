import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  AccesSocieteEntity,
  MembrePartenaireEntity,
  PartenaireMarqueBlancheEntity,
  RolePartenaireEntity,
  SocieteEntity,
  StatutPartenaireEntity,
  ThemeMarqueEntity,
} from './domain/organisations/entities';
// Interface controllers
import {
  MembrePartenaireController,
  PartenaireMarqueBlancheController,
  RolePartenaireController,
  SocieteController,
  StatutPartenaireController,
  ThemeMarqueController,
} from './infrastructure/grpc/organisations';
// Infrastructure services
import {
  MembrePartenaireService,
  PartenaireMarqueBlancheService,
  RolePartenaireService,
  SocieteService,
  StatutPartenaireService,
  ThemeMarqueService,
} from './infrastructure/persistence/typeorm/repositories/organisations';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccesSocieteEntity,
      SocieteEntity,
      StatutPartenaireEntity,
      RolePartenaireEntity,
      ThemeMarqueEntity,
      PartenaireMarqueBlancheEntity,
      MembrePartenaireEntity,
    ]),
  ],
  controllers: [
    SocieteController,
    StatutPartenaireController,
    RolePartenaireController,
    ThemeMarqueController,
    PartenaireMarqueBlancheController,
    MembrePartenaireController,
  ],
  providers: [
    SocieteService,
    StatutPartenaireService,
    RolePartenaireService,
    ThemeMarqueService,
    PartenaireMarqueBlancheService,
    MembrePartenaireService,
  ],
  exports: [
    SocieteService,
    StatutPartenaireService,
    RolePartenaireService,
    ThemeMarqueService,
    PartenaireMarqueBlancheService,
    MembrePartenaireService,
  ],
})
export class OrganisationsModule {}
