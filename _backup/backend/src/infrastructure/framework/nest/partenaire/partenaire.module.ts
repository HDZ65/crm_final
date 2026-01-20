import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { PartenaireMarqueBlancheController } from './controllers/partenaire-marque-blanche.controller';
import { MembrePartenaireController } from './controllers/membre-partenaire.controller';
import { RolePartenaireController } from './controllers/role-partenaire.controller';
import { StatutPartenaireController } from './controllers/statut-partenaire.controller';
import { ModeleDistributionController } from './controllers/modele-distribution.controller';
import { ThemeMarqueController } from './controllers/theme-marque.controller';
import { GrilleTarifaireController } from './controllers/grille-tarifaire.controller';
import { PrixProduitController } from './controllers/prix-produit.controller';

// Entities
import { PartenaireMarqueBlancheEntity } from '../../../db/entities/partenaire-marque-blanche.entity';
import { MembrePartenaireEntity } from '../../../db/entities/membre-partenaire.entity';
import { RolePartenaireEntity } from '../../../db/entities/role-partenaire.entity';
import { StatutPartenaireEntity } from '../../../db/entities/statut-partenaire.entity';
import { ModeleDistributionEntity } from '../../../db/entities/modele-distribution.entity';
import { ThemeMarqueEntity } from '../../../db/entities/theme-marque.entity';
import { GrilleTarifaireEntity } from '../../../db/entities/grille-tarifaire.entity';
import { PrixProduitEntity } from '../../../db/entities/prix-produit.entity';

// Repositories
import { TypeOrmPartenaireMarqueBlancheRepository } from '../../../repositories/typeorm-partenaire-marque-blanche.repository';
import { TypeOrmMembrePartenaireRepository } from '../../../repositories/typeorm-membre-partenaire.repository';
import { TypeOrmRolePartenaireRepository } from '../../../repositories/typeorm-role-partenaire.repository';
import { TypeOrmStatutPartenaireRepository } from '../../../repositories/typeorm-statut-partenaire.repository';
import { TypeOrmModeleDistributionRepository } from '../../../repositories/typeorm-modele-distribution.repository';
import { TypeOrmThemeMarqueRepository } from '../../../repositories/typeorm-theme-marque.repository';
import { TypeOrmGrilleTarifaireRepository } from '../../../repositories/typeorm-grille-tarifaire.repository';
import { TypeOrmPrixProduitRepository } from '../../../repositories/typeorm-prix-produit.repository';

// Use Cases - PartenaireMarqueBlanche
import { CreatePartenaireMarqueBlancheUseCase } from '../../../../applications/usecase/partenaire-marque-blanche/create-partenaire-marque-blanche.usecase';
import { GetPartenaireMarqueBlancheUseCase } from '../../../../applications/usecase/partenaire-marque-blanche/get-partenaire-marque-blanche.usecase';
import { UpdatePartenaireMarqueBlancheUseCase } from '../../../../applications/usecase/partenaire-marque-blanche/update-partenaire-marque-blanche.usecase';
import { DeletePartenaireMarqueBlancheUseCase } from '../../../../applications/usecase/partenaire-marque-blanche/delete-partenaire-marque-blanche.usecase';

// Use Cases - MembrePartenaire
import { CreateMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/create-membre-partenaire.usecase';
import { GetMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/get-membre-partenaire.usecase';
import { UpdateMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/update-membre-partenaire.usecase';
import { DeleteMembrePartenaireUseCase } from '../../../../applications/usecase/membre-partenaire/delete-membre-partenaire.usecase';

// Use Cases - RolePartenaire
import { CreateRolePartenaireUseCase } from '../../../../applications/usecase/role-partenaire/create-role-partenaire.usecase';
import { GetRolePartenaireUseCase } from '../../../../applications/usecase/role-partenaire/get-role-partenaire.usecase';
import { UpdateRolePartenaireUseCase } from '../../../../applications/usecase/role-partenaire/update-role-partenaire.usecase';
import { DeleteRolePartenaireUseCase } from '../../../../applications/usecase/role-partenaire/delete-role-partenaire.usecase';

// Use Cases - StatutPartenaire
import { CreateStatutPartenaireUseCase } from '../../../../applications/usecase/statut-partenaire/create-statut-partenaire.usecase';
import { GetStatutPartenaireUseCase } from '../../../../applications/usecase/statut-partenaire/get-statut-partenaire.usecase';
import { UpdateStatutPartenaireUseCase } from '../../../../applications/usecase/statut-partenaire/update-statut-partenaire.usecase';
import { DeleteStatutPartenaireUseCase } from '../../../../applications/usecase/statut-partenaire/delete-statut-partenaire.usecase';

// Use Cases - ModeleDistribution
import { CreateModeleDistributionUseCase } from '../../../../applications/usecase/modele-distribution/create-modele-distribution.usecase';
import { GetModeleDistributionUseCase } from '../../../../applications/usecase/modele-distribution/get-modele-distribution.usecase';
import { UpdateModeleDistributionUseCase } from '../../../../applications/usecase/modele-distribution/update-modele-distribution.usecase';
import { DeleteModeleDistributionUseCase } from '../../../../applications/usecase/modele-distribution/delete-modele-distribution.usecase';

// Use Cases - ThemeMarque
import { CreateThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/create-theme-marque.usecase';
import { GetThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/get-theme-marque.usecase';
import { UpdateThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/update-theme-marque.usecase';
import { DeleteThemeMarqueUseCase } from '../../../../applications/usecase/theme-marque/delete-theme-marque.usecase';

// Use Cases - GrilleTarifaire
import { CreateGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/create-grille-tarifaire.usecase';
import { GetGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/get-grille-tarifaire.usecase';
import { UpdateGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/update-grille-tarifaire.usecase';
import { DeleteGrilleTarifaireUseCase } from '../../../../applications/usecase/grille-tarifaire/delete-grille-tarifaire.usecase';

// Use Cases - PrixProduit
import { CreatePrixProduitUseCase } from '../../../../applications/usecase/prix-produit/create-prix-produit.usecase';
import { GetPrixProduitUseCase } from '../../../../applications/usecase/prix-produit/get-prix-produit.usecase';
import { UpdatePrixProduitUseCase } from '../../../../applications/usecase/prix-produit/update-prix-produit.usecase';
import { DeletePrixProduitUseCase } from '../../../../applications/usecase/prix-produit/delete-prix-produit.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartenaireMarqueBlancheEntity,
      MembrePartenaireEntity,
      RolePartenaireEntity,
      StatutPartenaireEntity,
      ModeleDistributionEntity,
      ThemeMarqueEntity,
      GrilleTarifaireEntity,
      PrixProduitEntity,
    ]),
  ],
  controllers: [
    PartenaireMarqueBlancheController,
    MembrePartenaireController,
    RolePartenaireController,
    StatutPartenaireController,
    ModeleDistributionController,
    ThemeMarqueController,
    GrilleTarifaireController,
    PrixProduitController,
  ],
  providers: [
    // PartenaireMarqueBlanche
    {
      provide: 'PartenaireMarqueBlancheRepositoryPort',
      useClass: TypeOrmPartenaireMarqueBlancheRepository,
    },
    CreatePartenaireMarqueBlancheUseCase,
    GetPartenaireMarqueBlancheUseCase,
    UpdatePartenaireMarqueBlancheUseCase,
    DeletePartenaireMarqueBlancheUseCase,

    // MembrePartenaire
    {
      provide: 'MembrePartenaireRepositoryPort',
      useClass: TypeOrmMembrePartenaireRepository,
    },
    CreateMembrePartenaireUseCase,
    GetMembrePartenaireUseCase,
    UpdateMembrePartenaireUseCase,
    DeleteMembrePartenaireUseCase,

    // RolePartenaire
    {
      provide: 'RolePartenaireRepositoryPort',
      useClass: TypeOrmRolePartenaireRepository,
    },
    CreateRolePartenaireUseCase,
    GetRolePartenaireUseCase,
    UpdateRolePartenaireUseCase,
    DeleteRolePartenaireUseCase,

    // StatutPartenaire
    {
      provide: 'StatutPartenaireRepositoryPort',
      useClass: TypeOrmStatutPartenaireRepository,
    },
    CreateStatutPartenaireUseCase,
    GetStatutPartenaireUseCase,
    UpdateStatutPartenaireUseCase,
    DeleteStatutPartenaireUseCase,

    // ModeleDistribution
    {
      provide: 'ModeleDistributionRepositoryPort',
      useClass: TypeOrmModeleDistributionRepository,
    },
    CreateModeleDistributionUseCase,
    GetModeleDistributionUseCase,
    UpdateModeleDistributionUseCase,
    DeleteModeleDistributionUseCase,

    // ThemeMarque
    {
      provide: 'ThemeMarqueRepositoryPort',
      useClass: TypeOrmThemeMarqueRepository,
    },
    CreateThemeMarqueUseCase,
    GetThemeMarqueUseCase,
    UpdateThemeMarqueUseCase,
    DeleteThemeMarqueUseCase,

    // GrilleTarifaire
    {
      provide: 'GrilleTarifaireRepositoryPort',
      useClass: TypeOrmGrilleTarifaireRepository,
    },
    CreateGrilleTarifaireUseCase,
    GetGrilleTarifaireUseCase,
    UpdateGrilleTarifaireUseCase,
    DeleteGrilleTarifaireUseCase,

    // PrixProduit
    {
      provide: 'PrixProduitRepositoryPort',
      useClass: TypeOrmPrixProduitRepository,
    },
    CreatePrixProduitUseCase,
    GetPrixProduitUseCase,
    UpdatePrixProduitUseCase,
    DeletePrixProduitUseCase,
  ],
  exports: [
    'PartenaireMarqueBlancheRepositoryPort',
    'MembrePartenaireRepositoryPort',
    'RolePartenaireRepositoryPort',
    'StatutPartenaireRepositoryPort',
    'ModeleDistributionRepositoryPort',
    'ThemeMarqueRepositoryPort',
    'GrilleTarifaireRepositoryPort',
    'PrixProduitRepositoryPort',
  ],
})
export class PartenaireModule {}
