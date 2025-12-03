import { Module, DynamicModule } from '@nestjs/common';
import { KeycloakModule } from './keycloak.module';
import { SecurityModule } from './security.module';

import { AppController } from './http/app.controller';

// ========================================
// PROVIDERS GROUPÉS PAR DOMAINE
// ========================================
import {
  AUTH_PROVIDERS,
  CLIENT_PROVIDERS,
  CONTRACT_PROVIDERS,
  LOGISTICS_PROVIDERS,
  EMAIL_PROVIDERS,
  AI_PROVIDERS,
  PRODUCT_PROVIDERS
} from './providers';

// <plop:imports>
import { AuthController } from './http/auth.controller';
import { OrganisationController } from './http/organisation.controller';
import { OrganisationEntity } from '../../db/entities/organisation.entity';
import { TypeOrmOrganisationRepository } from '../../repositories/typeorm-organisation.repository';
import { CreateOrganisationUseCase } from '../../../applications/usecase/organisation/create-organisation.usecase';
import { GetOrganisationUseCase } from '../../../applications/usecase/organisation/get-organisation.usecase';
import { UpdateOrganisationUseCase } from '../../../applications/usecase/organisation/update-organisation.usecase';
import { DeleteOrganisationUseCase } from '../../../applications/usecase/organisation/delete-organisation.usecase';
import { AiController } from './http/ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoiteMailController } from './http/boite-mail.controller';
import { BoiteMailEntity } from '../../db/entities/boite-mail.entity';
import { OAuthController } from './http/oauth.controller';
import { ClientBaseController } from './http/client-base.controller';
import { ClientBaseEntity } from '../../db/entities/client-base.entity';
import { ClientEntrepriseController } from './http/client-entreprise.controller';
import { ClientEntrepriseEntity } from '../../db/entities/client-entreprise.entity';
import { RoleController } from './http/role.controller';
import { RoleEntity } from '../../db/entities/role.entity';
import { UtilisateurController } from './http/utilisateur.controller';
import { UtilisateurEntity } from '../../db/entities/utilisateur.entity';
import { ProduitController } from './http/produit.controller';
import { ProduitEntity } from '../../db/entities/produit.entity';
import { ClientPartenaireController } from './http/client-partenaire.controller';
import { ClientPartenaireEntity } from '../../db/entities/client-partenaire.entity';
import { StatutContratController } from './http/statut-contrat.controller';
import { StatutContratEntity } from '../../db/entities/statut-contrat.entity';
import { ConditionPaiementController } from './http/condition-paiement.controller';
import { ConditionPaiementEntity } from '../../db/entities/condition-paiement.entity';
import { TypeActiviteController } from './http/type-activite.controller';
import { TypeActiviteEntity } from '../../db/entities/type-activite.entity';
import { ContratController } from './http/contrat.controller';
import { ContratEntity } from '../../db/entities/contrat.entity';
import { LigneContratController } from './http/ligne-contrat.controller';
import { LigneContratEntity } from '../../db/entities/ligne-contrat.entity';
import { ActiviteController } from './http/activite.controller';
import { CreateActiviteUseCase } from '../../../applications/usecase/activite/create-activite.usecase';
import { GetActiviteUseCase } from '../../../applications/usecase/activite/get-activite.usecase';
import { UpdateActiviteUseCase } from '../../../applications/usecase/activite/update-activite.usecase';
import { DeleteActiviteUseCase } from '../../../applications/usecase/activite/delete-activite.usecase';
import { ActiviteEntity } from '../../db/entities/activite.entity';
import { TypeOrmActiviteRepository } from '../../repositories/typeorm-activite.repository';
import { AdresseController } from './http/adresse.controller';
import { CreateAdresseUseCase } from '../../../applications/usecase/adresse/create-adresse.usecase';
import { GetAdresseUseCase } from '../../../applications/usecase/adresse/get-adresse.usecase';
import { UpdateAdresseUseCase } from '../../../applications/usecase/adresse/update-adresse.usecase';
import { DeleteAdresseUseCase } from '../../../applications/usecase/adresse/delete-adresse.usecase';
import { AdresseEntity } from '../../db/entities/adresse.entity';
import { TypeOrmAdresseRepository } from '../../repositories/typeorm-adresse.repository';
import { HistoriqueStatutContratController } from './http/historique-statut-contrat.controller';
import { CreateHistoriqueStatutContratUseCase } from '../../../applications/usecase/historique-statut-contrat/create-historique-statut-contrat.usecase';
import { GetHistoriqueStatutContratUseCase } from '../../../applications/usecase/historique-statut-contrat/get-historique-statut-contrat.usecase';
import { UpdateHistoriqueStatutContratUseCase } from '../../../applications/usecase/historique-statut-contrat/update-historique-statut-contrat.usecase';
import { DeleteHistoriqueStatutContratUseCase } from '../../../applications/usecase/historique-statut-contrat/delete-historique-statut-contrat.usecase';
import { HistoriqueStatutContratEntity } from '../../db/entities/historique-statut-contrat.entity';
import { TypeOrmHistoriqueStatutContratRepository } from '../../repositories/typeorm-historique-statut-contrat.repository';
import { PieceJointeController } from './http/piece-jointe.controller';
import { CreatePieceJointeUseCase } from '../../../applications/usecase/piece-jointe/create-piece-jointe.usecase';
import { GetPieceJointeUseCase } from '../../../applications/usecase/piece-jointe/get-piece-jointe.usecase';
import { UpdatePieceJointeUseCase } from '../../../applications/usecase/piece-jointe/update-piece-jointe.usecase';
import { DeletePieceJointeUseCase } from '../../../applications/usecase/piece-jointe/delete-piece-jointe.usecase';
import { PieceJointeEntity } from '../../db/entities/piece-jointe.entity';
import { TypeOrmPieceJointeRepository } from '../../repositories/typeorm-piece-jointe.repository';
import { StatutFactureController } from './http/statut-facture.controller';
import { CreateStatutFactureUseCase } from '../../../applications/usecase/statut-facture/create-statut-facture.usecase';
import { GetStatutFactureUseCase } from '../../../applications/usecase/statut-facture/get-statut-facture.usecase';
import { UpdateStatutFactureUseCase } from '../../../applications/usecase/statut-facture/update-statut-facture.usecase';
import { DeleteStatutFactureUseCase } from '../../../applications/usecase/statut-facture/delete-statut-facture.usecase';
import { StatutFactureEntity } from '../../db/entities/statut-facture.entity';
import { TypeOrmStatutFactureRepository } from '../../repositories/typeorm-statut-facture.repository';
import { EmissionFactureController } from './http/emission-facture.controller';
import { CreateEmissionFactureUseCase } from '../../../applications/usecase/emission-facture/create-emission-facture.usecase';
import { GetEmissionFactureUseCase } from '../../../applications/usecase/emission-facture/get-emission-facture.usecase';
import { UpdateEmissionFactureUseCase } from '../../../applications/usecase/emission-facture/update-emission-facture.usecase';
import { DeleteEmissionFactureUseCase } from '../../../applications/usecase/emission-facture/delete-emission-facture.usecase';
import { EmissionFactureEntity } from '../../db/entities/emission-facture.entity';
import { TypeOrmEmissionFactureRepository } from '../../repositories/typeorm-emission-facture.repository';
import { FactureController } from './http/facture.controller';
import { CreateFactureUseCase } from '../../../applications/usecase/facture/create-facture.usecase';
import { GetFactureUseCase } from '../../../applications/usecase/facture/get-facture.usecase';
import { UpdateFactureUseCase } from '../../../applications/usecase/facture/update-facture.usecase';
import { DeleteFactureUseCase } from '../../../applications/usecase/facture/delete-facture.usecase';
import { FactureEntity } from '../../db/entities/facture.entity';
import { TypeOrmFactureRepository } from '../../repositories/typeorm-facture.repository';
import { StatutPartenaireController } from './http/statut-partenaire.controller';
import { CreateStatutPartenaireUseCase } from '../../../applications/usecase/statut-partenaire/create-statut-partenaire.usecase';
import { GetStatutPartenaireUseCase } from '../../../applications/usecase/statut-partenaire/get-statut-partenaire.usecase';
import { UpdateStatutPartenaireUseCase } from '../../../applications/usecase/statut-partenaire/update-statut-partenaire.usecase';
import { DeleteStatutPartenaireUseCase } from '../../../applications/usecase/statut-partenaire/delete-statut-partenaire.usecase';
import { StatutPartenaireEntity } from '../../db/entities/statut-partenaire.entity';
import { TypeOrmStatutPartenaireRepository } from '../../repositories/typeorm-statut-partenaire.repository';
import { ModeleDistributionController } from './http/modele-distribution.controller';
import { CreateModeleDistributionUseCase } from '../../../applications/usecase/modele-distribution/create-modele-distribution.usecase';
import { GetModeleDistributionUseCase } from '../../../applications/usecase/modele-distribution/get-modele-distribution.usecase';
import { UpdateModeleDistributionUseCase } from '../../../applications/usecase/modele-distribution/update-modele-distribution.usecase';
import { DeleteModeleDistributionUseCase } from '../../../applications/usecase/modele-distribution/delete-modele-distribution.usecase';
import { ModeleDistributionEntity } from '../../db/entities/modele-distribution.entity';
import { TypeOrmModeleDistributionRepository } from '../../repositories/typeorm-modele-distribution.repository';
import { FacturationParController } from './http/facturation-par.controller';
import { CreateFacturationParUseCase } from '../../../applications/usecase/facturation-par/create-facturation-par.usecase';
import { GetFacturationParUseCase } from '../../../applications/usecase/facturation-par/get-facturation-par.usecase';
import { UpdateFacturationParUseCase } from '../../../applications/usecase/facturation-par/update-facturation-par.usecase';
import { DeleteFacturationParUseCase } from '../../../applications/usecase/facturation-par/delete-facturation-par.usecase';
import { FacturationParEntity } from '../../db/entities/facturation-par.entity';
import { TypeOrmFacturationParRepository } from '../../repositories/typeorm-facturation-par.repository';
import { PeriodeFacturationController } from './http/periode-facturation.controller';
import { CreatePeriodeFacturationUseCase } from '../../../applications/usecase/periode-facturation/create-periode-facturation.usecase';
import { GetPeriodeFacturationUseCase } from '../../../applications/usecase/periode-facturation/get-periode-facturation.usecase';
import { UpdatePeriodeFacturationUseCase } from '../../../applications/usecase/periode-facturation/update-periode-facturation.usecase';
import { DeletePeriodeFacturationUseCase } from '../../../applications/usecase/periode-facturation/delete-periode-facturation.usecase';
import { PeriodeFacturationEntity } from '../../db/entities/periode-facturation.entity';
import { TypeOrmPeriodeFacturationRepository } from '../../repositories/typeorm-periode-facturation.repository';
import { RolePartenaireController } from './http/role-partenaire.controller';
import { CreateRolePartenaireUseCase } from '../../../applications/usecase/role-partenaire/create-role-partenaire.usecase';
import { GetRolePartenaireUseCase } from '../../../applications/usecase/role-partenaire/get-role-partenaire.usecase';
import { UpdateRolePartenaireUseCase } from '../../../applications/usecase/role-partenaire/update-role-partenaire.usecase';
import { DeleteRolePartenaireUseCase } from '../../../applications/usecase/role-partenaire/delete-role-partenaire.usecase';
import { RolePartenaireEntity } from '../../db/entities/role-partenaire.entity';
import { TypeOrmRolePartenaireRepository } from '../../repositories/typeorm-role-partenaire.repository';
import { StatutClientController } from './http/statut-client.controller';
import { CreateStatutClientUseCase } from '../../../applications/usecase/statut-client/create-statut-client.usecase';
import { GetStatutClientUseCase } from '../../../applications/usecase/statut-client/get-statut-client.usecase';
import { UpdateStatutClientUseCase } from '../../../applications/usecase/statut-client/update-statut-client.usecase';
import { DeleteStatutClientUseCase } from '../../../applications/usecase/statut-client/delete-statut-client.usecase';
import { StatutClientEntity } from '../../db/entities/statut-client.entity';
import { TypeOrmStatutClientRepository } from '../../repositories/typeorm-statut-client.repository';
import { PartenaireMarqueBlancheController } from './http/partenaire-marque-blanche.controller';
import { CreatePartenaireMarqueBlancheUseCase } from '../../../applications/usecase/partenaire-marque-blanche/create-partenaire-marque-blanche.usecase';
import { GetPartenaireMarqueBlancheUseCase } from '../../../applications/usecase/partenaire-marque-blanche/get-partenaire-marque-blanche.usecase';
import { UpdatePartenaireMarqueBlancheUseCase } from '../../../applications/usecase/partenaire-marque-blanche/update-partenaire-marque-blanche.usecase';
import { DeletePartenaireMarqueBlancheUseCase } from '../../../applications/usecase/partenaire-marque-blanche/delete-partenaire-marque-blanche.usecase';
import { PartenaireMarqueBlancheEntity } from '../../db/entities/partenaire-marque-blanche.entity';
import { TypeOrmPartenaireMarqueBlancheRepository } from '../../repositories/typeorm-partenaire-marque-blanche.repository';
import { ThemeMarqueController } from './http/theme-marque.controller';
import { CreateThemeMarqueUseCase } from '../../../applications/usecase/theme-marque/create-theme-marque.usecase';
import { GetThemeMarqueUseCase } from '../../../applications/usecase/theme-marque/get-theme-marque.usecase';
import { UpdateThemeMarqueUseCase } from '../../../applications/usecase/theme-marque/update-theme-marque.usecase';
import { DeleteThemeMarqueUseCase } from '../../../applications/usecase/theme-marque/delete-theme-marque.usecase';
import { ThemeMarqueEntity } from '../../db/entities/theme-marque.entity';
import { TypeOrmThemeMarqueRepository } from '../../repositories/typeorm-theme-marque.repository';
import { GrilleTarifaireController } from './http/grille-tarifaire.controller';
import { CreateGrilleTarifaireUseCase } from '../../../applications/usecase/grille-tarifaire/create-grille-tarifaire.usecase';
import { GetGrilleTarifaireUseCase } from '../../../applications/usecase/grille-tarifaire/get-grille-tarifaire.usecase';
import { UpdateGrilleTarifaireUseCase } from '../../../applications/usecase/grille-tarifaire/update-grille-tarifaire.usecase';
import { DeleteGrilleTarifaireUseCase } from '../../../applications/usecase/grille-tarifaire/delete-grille-tarifaire.usecase';
import { GrilleTarifaireEntity } from '../../db/entities/grille-tarifaire.entity';
import { TypeOrmGrilleTarifaireRepository } from '../../repositories/typeorm-grille-tarifaire.repository';
import { PrixProduitController } from './http/prix-produit.controller';
import { CreatePrixProduitUseCase } from '../../../applications/usecase/prix-produit/create-prix-produit.usecase';
import { GetPrixProduitUseCase } from '../../../applications/usecase/prix-produit/get-prix-produit.usecase';
import { UpdatePrixProduitUseCase } from '../../../applications/usecase/prix-produit/update-prix-produit.usecase';
import { DeletePrixProduitUseCase } from '../../../applications/usecase/prix-produit/delete-prix-produit.usecase';
import { PrixProduitEntity } from '../../db/entities/prix-produit.entity';
import { TypeOrmPrixProduitRepository } from '../../repositories/typeorm-prix-produit.repository';
import { MembrePartenaireController } from './http/membre-partenaire.controller';
import { CreateMembrePartenaireUseCase } from '../../../applications/usecase/membre-partenaire/create-membre-partenaire.usecase';
import { GetMembrePartenaireUseCase } from '../../../applications/usecase/membre-partenaire/get-membre-partenaire.usecase';
import { UpdateMembrePartenaireUseCase } from '../../../applications/usecase/membre-partenaire/update-membre-partenaire.usecase';
import { DeleteMembrePartenaireUseCase } from '../../../applications/usecase/membre-partenaire/delete-membre-partenaire.usecase';
import { MembrePartenaireEntity } from '../../db/entities/membre-partenaire.entity';
import { TypeOrmMembrePartenaireRepository } from '../../repositories/typeorm-membre-partenaire.repository';
import { ActivateContractUseCase } from '../../../applications/usecase/contract-orchestration/activate-contract.usecase';
import { SuspendContractUseCase } from '../../../applications/usecase/contract-orchestration/suspend-contract.usecase';
import { TerminateContractUseCase } from '../../../applications/usecase/contract-orchestration/terminate-contract.usecase';
import { PortInContractUseCase } from '../../../applications/usecase/contract-orchestration/port-in-contract.usecase';
import { ContractOrchestrationService } from '../../services/contract-orchestration.service';
import { ContractOrchestrationHistoryEntity } from '../../db/entities/contract-orchestration-history.entity';
import { TypeOrmContractOrchestrationHistoryRepository } from '../../repositories/typeorm-contract-orchestration-history.repository';
import { LogisticsController } from './http/logistics.controller';
import { ContractOrchestrationController } from './http/contract-orchestration.controller';
import { CompteEntity } from '../../db/entities/compte.entity';
import { PermissionController } from './http/permission.controller';
import { PermissionEntity } from '../../db/entities/permission.entity';
import { RolePermissionController } from './http/role-permission.controller';
import { RolePermissionEntity } from '../../db/entities/role-permission.entity';
import { MembreCompteController } from './http/membre-compte.controller';
import { MembreOrganisationEntity } from '../../db/entities/membre-compte.entity';
import { InvitationCompteController } from './http/invitation-compte.controller';
import { InvitationCompteEntity } from '../../db/entities/invitation-compte.entity';
import { GroupeController } from './http/groupe.controller';
import { CreateGroupeUseCase } from '../../../applications/usecase/groupe/create-groupe.usecase';
import { GetGroupeUseCase } from '../../../applications/usecase/groupe/get-groupe.usecase';
import { UpdateGroupeUseCase } from '../../../applications/usecase/groupe/update-groupe.usecase';
import { DeleteGroupeUseCase } from '../../../applications/usecase/groupe/delete-groupe.usecase';
import { GroupeEntity } from '../../db/entities/groupe.entity';
import { TypeOrmGroupeRepository } from '../../repositories/typeorm-groupe.repository';
import { SocieteController } from './http/societe.controller';
import { CreateSocieteUseCase } from '../../../applications/usecase/societe/create-societe.usecase';
import { GetSocieteUseCase } from '../../../applications/usecase/societe/get-societe.usecase';
import { UpdateSocieteUseCase } from '../../../applications/usecase/societe/update-societe.usecase';
import { DeleteSocieteUseCase } from '../../../applications/usecase/societe/delete-societe.usecase';
import { SocieteEntity } from '../../db/entities/societe.entity';
import { TypeOrmSocieteRepository } from '../../repositories/typeorm-societe.repository';
import { GroupeEntiteController } from './http/groupe-entite.controller';
import { CreateGroupeEntiteUseCase } from '../../../applications/usecase/groupe-entite/create-groupe-entite.usecase';
import { GetGroupeEntiteUseCase } from '../../../applications/usecase/groupe-entite/get-groupe-entite.usecase';
import { UpdateGroupeEntiteUseCase } from '../../../applications/usecase/groupe-entite/update-groupe-entite.usecase';
import { DeleteGroupeEntiteUseCase } from '../../../applications/usecase/groupe-entite/delete-groupe-entite.usecase';
import { GroupeEntiteEntity } from '../../db/entities/groupe-entite.entity';
import { TypeOrmGroupeEntiteRepository } from '../../repositories/typeorm-groupe-entite.repository';
import { MembreGroupeController } from './http/membre-groupe.controller';
import { CreateMembreGroupeUseCase } from '../../../applications/usecase/membre-groupe/create-membre-groupe.usecase';
import { GetMembreGroupeUseCase } from '../../../applications/usecase/membre-groupe/get-membre-groupe.usecase';
import { UpdateMembreGroupeUseCase } from '../../../applications/usecase/membre-groupe/update-membre-groupe.usecase';
import { DeleteMembreGroupeUseCase } from '../../../applications/usecase/membre-groupe/delete-membre-groupe.usecase';
import { MembreGroupeEntity } from '../../db/entities/membre-groupe.entity';
import { TypeOrmMembreGroupeRepository } from '../../repositories/typeorm-membre-groupe.repository';
import { AffectationGroupeClientController } from './http/affectation-groupe-client.controller';
import { CreateAffectationGroupeClientUseCase } from '../../../applications/usecase/affectation-groupe-client/create-affectation-groupe-client.usecase';
import { GetAffectationGroupeClientUseCase } from '../../../applications/usecase/affectation-groupe-client/get-affectation-groupe-client.usecase';
import { UpdateAffectationGroupeClientUseCase } from '../../../applications/usecase/affectation-groupe-client/update-affectation-groupe-client.usecase';
import { DeleteAffectationGroupeClientUseCase } from '../../../applications/usecase/affectation-groupe-client/delete-affectation-groupe-client.usecase';
import { AffectationGroupeClientEntity } from '../../db/entities/affectation-groupe-client.entity';
import { TypeOrmAffectationGroupeClientRepository } from '../../repositories/typeorm-affectation-groupe-client.repository';
import { TransporteurCompteController } from './http/transporteur-compte.controller';
import { TransporteurCompteEntity } from '../../db/entities/transporteur-compte.entity';
import { ExpeditionController } from './http/expedition.controller';
import { ExpeditionEntity } from '../../db/entities/expedition.entity';
import { ColisController } from './http/colis.controller';
import { ColisEntity } from '../../db/entities/colis.entity';
import { EvenementSuiviController } from './http/evenement-suivi.controller';
import { EvenementSuiviEntity } from '../../db/entities/evenement-suivi.entity';
import { CompteController } from './http/compte.controller';
import { CreateCompteUseCase } from '../../../applications/usecase/compte/create-compte.usecase';
import { GetCompteUseCase } from '../../../applications/usecase/compte/get-compte.usecase';
import { UpdateCompteUseCase } from '../../../applications/usecase/compte/update-compte.usecase';
import { DeleteCompteUseCase } from '../../../applications/usecase/compte/delete-compte.usecase';
import { TypeOrmCompteRepository } from '../../repositories/typeorm-compte.repository';
import { CreatePermissionUseCase } from '../../../applications/usecase/permission/create-permission.usecase';
import { GetPermissionUseCase } from '../../../applications/usecase/permission/get-permission.usecase';
import { UpdatePermissionUseCase } from '../../../applications/usecase/permission/update-permission.usecase';
import { DeletePermissionUseCase } from '../../../applications/usecase/permission/delete-permission.usecase';
import { TypeOrmPermissionRepository } from '../../repositories/typeorm-permission.repository';
import { CreateRolePermissionUseCase } from '../../../applications/usecase/role-permission/create-role-permission.usecase';
import { GetRolePermissionUseCase } from '../../../applications/usecase/role-permission/get-role-permission.usecase';
import { UpdateRolePermissionUseCase } from '../../../applications/usecase/role-permission/update-role-permission.usecase';
import { DeleteRolePermissionUseCase } from '../../../applications/usecase/role-permission/delete-role-permission.usecase';
import { TypeOrmRolePermissionRepository } from '../../repositories/typeorm-role-permission.repository';
import { CreateMembreCompteUseCase } from '../../../applications/usecase/membre-compte/create-membre-compte.usecase';
import { GetMembreCompteUseCase } from '../../../applications/usecase/membre-compte/get-membre-compte.usecase';
import { UpdateMembreCompteUseCase } from '../../../applications/usecase/membre-compte/update-membre-compte.usecase';
import { DeleteMembreCompteUseCase } from '../../../applications/usecase/membre-compte/delete-membre-compte.usecase';
import { TypeOrmMembreCompteRepository } from '../../repositories/typeorm-membre-compte.repository';
import { CreateInvitationCompteUseCase } from '../../../applications/usecase/invitation-compte/create-invitation-compte.usecase';
import { GetInvitationCompteUseCase } from '../../../applications/usecase/invitation-compte/get-invitation-compte.usecase';
import { UpdateInvitationCompteUseCase } from '../../../applications/usecase/invitation-compte/update-invitation-compte.usecase';
import { DeleteInvitationCompteUseCase } from '../../../applications/usecase/invitation-compte/delete-invitation-compte.usecase';
import { TypeOrmInvitationCompteRepository } from '../../repositories/typeorm-invitation-compte.repository';
import { CreateTransporteurCompteUseCase } from '../../../applications/usecase/transporteur-compte/create-transporteur-compte.usecase';
import { GetTransporteurCompteUseCase } from '../../../applications/usecase/transporteur-compte/get-transporteur-compte.usecase';
import { UpdateTransporteurCompteUseCase } from '../../../applications/usecase/transporteur-compte/update-transporteur-compte.usecase';
import { DeleteTransporteurCompteUseCase } from '../../../applications/usecase/transporteur-compte/delete-transporteur-compte.usecase';
import { TypeOrmTransporteurCompteRepository } from '../../repositories/typeorm-transporteur-compte.repository';
import { CreateExpeditionUseCase } from '../../../applications/usecase/expedition/create-expedition.usecase';
import { GetExpeditionUseCase } from '../../../applications/usecase/expedition/get-expedition.usecase';
import { GetExpeditionWithDetailsUseCase } from '../../../applications/usecase/expedition/get-expedition-with-details.usecase';
import { UpdateExpeditionUseCase } from '../../../applications/usecase/expedition/update-expedition.usecase';
import { DeleteExpeditionUseCase } from '../../../applications/usecase/expedition/delete-expedition.usecase';
import { TypeOrmExpeditionRepository } from '../../repositories/typeorm-expedition.repository';
import { CreateColisUseCase } from '../../../applications/usecase/colis/create-colis.usecase';
import { GetColisUseCase } from '../../../applications/usecase/colis/get-colis.usecase';
import { UpdateColisUseCase } from '../../../applications/usecase/colis/update-colis.usecase';
import { DeleteColisUseCase } from '../../../applications/usecase/colis/delete-colis.usecase';
import { TypeOrmColisRepository } from '../../repositories/typeorm-colis.repository';
import { CreateEvenementSuiviUseCase } from '../../../applications/usecase/evenement-suivi/create-evenement-suivi.usecase';
import { GetEvenementSuiviUseCase } from '../../../applications/usecase/evenement-suivi/get-evenement-suivi.usecase';
import { UpdateEvenementSuiviUseCase } from '../../../applications/usecase/evenement-suivi/update-evenement-suivi.usecase';
import { DeleteEvenementSuiviUseCase } from '../../../applications/usecase/evenement-suivi/delete-evenement-suivi.usecase';
import { TypeOrmEvenementSuiviRepository } from '../../repositories/typeorm-evenement-suivi.repository';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from '../../db/database.config';
import { DatabaseService } from '../../db/database.service';
import { NotificationController } from './http/notification.controller';
import { NotificationEntity } from '../../db/entities/notification.entity';
import { TypeOrmNotificationRepository } from '../../repositories/typeorm-notification.repository';
import { CreateNotificationUseCase } from '../../../applications/usecase/notification/create-notification.usecase';
import { GetNotificationUseCase } from '../../../applications/usecase/notification/get-notification.usecase';
import { UpdateNotificationUseCase } from '../../../applications/usecase/notification/update-notification.usecase';
import { DeleteNotificationUseCase } from '../../../applications/usecase/notification/delete-notification.usecase';
import { NotificationGateway } from '../../websocket/notification.gateway';
import { NotificationService } from '../../services/notification.service';
import { DashboardController } from './http/dashboard.controller';
import { GetDashboardKpisUseCase } from '../../../applications/usecase/dashboard/get-dashboard-kpis.usecase';
import { GetEvolutionCaUseCase } from '../../../applications/usecase/dashboard/get-evolution-ca.usecase';
import { GetRepartitionProduitsUseCase } from '../../../applications/usecase/dashboard/get-repartition-produits.usecase';
import { GetStatsSocietesUseCase } from '../../../applications/usecase/dashboard/get-stats-societes.usecase';
import { GetAlertesUseCase } from '../../../applications/usecase/dashboard/get-alertes.usecase';
import { GetKpisCommerciauxUseCase } from '../../../applications/usecase/dashboard/get-kpis-commerciaux.usecase';
import { ApporteurController } from './http/apporteur.controller';
import { ApporteurEntity } from '../../db/entities/apporteur.entity';
import { TypeOrmApporteurRepository } from '../../repositories/typeorm-apporteur.repository';
import { CreateApporteurUseCase } from '../../../applications/usecase/apporteur/create-apporteur.usecase';
import { GetApporteurUseCase } from '../../../applications/usecase/apporteur/get-apporteur.usecase';
import { UpdateApporteurUseCase } from '../../../applications/usecase/apporteur/update-apporteur.usecase';
import { DeleteApporteurUseCase } from '../../../applications/usecase/apporteur/delete-apporteur.usecase';
import { StatutCommissionController } from './http/statut-commission.controller';
import { StatutCommissionEntity } from '../../db/entities/statut-commission.entity';
import { TypeOrmStatutCommissionRepository } from '../../repositories/typeorm-statut-commission.repository';
import { CreateStatutCommissionUseCase } from '../../../applications/usecase/statut-commission/create-statut-commission.usecase';
import { GetStatutCommissionUseCase } from '../../../applications/usecase/statut-commission/get-statut-commission.usecase';
import { UpdateStatutCommissionUseCase } from '../../../applications/usecase/statut-commission/update-statut-commission.usecase';
import { DeleteStatutCommissionUseCase } from '../../../applications/usecase/statut-commission/delete-statut-commission.usecase';
import { CommissionController } from './http/commission.controller';
import { CommissionEntity } from '../../db/entities/commission.entity';
import { TypeOrmCommissionRepository } from '../../repositories/typeorm-commission.repository';
import { CreateCommissionUseCase } from '../../../applications/usecase/commission/create-commission.usecase';
import { GetCommissionUseCase } from '../../../applications/usecase/commission/get-commission.usecase';
import { GetCommissionWithDetailsUseCase } from '../../../applications/usecase/commission/get-commission-with-details.usecase';
import { UpdateCommissionUseCase } from '../../../applications/usecase/commission/update-commission.usecase';
import { DeleteCommissionUseCase } from '../../../applications/usecase/commission/delete-commission.usecase';
// Barème Commission
import { BaremeCommissionController } from './http/bareme-commission.controller';
import { BaremeCommissionEntity } from '../../db/entities/bareme-commission.entity';
import { TypeOrmBaremeCommissionRepository } from '../../repositories/typeorm-bareme-commission.repository';
import { CreateBaremeCommissionUseCase } from '../../../applications/usecase/bareme-commission/create-bareme-commission.usecase';
import { GetBaremeCommissionUseCase } from '../../../applications/usecase/bareme-commission/get-bareme-commission.usecase';
import { UpdateBaremeCommissionUseCase } from '../../../applications/usecase/bareme-commission/update-bareme-commission.usecase';
import { DeleteBaremeCommissionUseCase } from '../../../applications/usecase/bareme-commission/delete-bareme-commission.usecase';
// Palier Commission
import { PalierCommissionController } from './http/palier-commission.controller';
import { PalierCommissionEntity } from '../../db/entities/palier-commission.entity';
import { TypeOrmPalierCommissionRepository } from '../../repositories/typeorm-palier-commission.repository';
import { CreatePalierCommissionUseCase } from '../../../applications/usecase/palier-commission/create-palier-commission.usecase';
import { GetPalierCommissionUseCase } from '../../../applications/usecase/palier-commission/get-palier-commission.usecase';
import { UpdatePalierCommissionUseCase } from '../../../applications/usecase/palier-commission/update-palier-commission.usecase';
import { DeletePalierCommissionUseCase } from '../../../applications/usecase/palier-commission/delete-palier-commission.usecase';
// Reprise Commission
import { RepriseCommissionController } from './http/reprise-commission.controller';
import { RepriseCommissionEntity } from '../../db/entities/reprise-commission.entity';
import { TypeOrmRepriseCommissionRepository } from '../../repositories/typeorm-reprise-commission.repository';
import { CreateRepriseCommissionUseCase } from '../../../applications/usecase/reprise-commission/create-reprise-commission.usecase';
import { GetRepriseCommissionUseCase } from '../../../applications/usecase/reprise-commission/get-reprise-commission.usecase';
import { UpdateRepriseCommissionUseCase } from '../../../applications/usecase/reprise-commission/update-reprise-commission.usecase';
import { DeleteRepriseCommissionUseCase } from '../../../applications/usecase/reprise-commission/delete-reprise-commission.usecase';
// Bordereau Commission
import { BordereauCommissionController } from './http/bordereau-commission.controller';
import { BordereauCommissionEntity } from '../../db/entities/bordereau-commission.entity';
import { TypeOrmBordereauCommissionRepository } from '../../repositories/typeorm-bordereau-commission.repository';
import { CreateBordereauCommissionUseCase } from '../../../applications/usecase/bordereau-commission/create-bordereau-commission.usecase';
import { GetBordereauCommissionUseCase } from '../../../applications/usecase/bordereau-commission/get-bordereau-commission.usecase';
import { UpdateBordereauCommissionUseCase } from '../../../applications/usecase/bordereau-commission/update-bordereau-commission.usecase';
import { DeleteBordereauCommissionUseCase } from '../../../applications/usecase/bordereau-commission/delete-bordereau-commission.usecase';
// Ligne Bordereau
import { LigneBordereauController } from './http/ligne-bordereau.controller';
import { LigneBordereauEntity } from '../../db/entities/ligne-bordereau.entity';
import { TypeOrmLigneBordereauRepository } from '../../repositories/typeorm-ligne-bordereau.repository';
import { CreateLigneBordereauUseCase } from '../../../applications/usecase/ligne-bordereau/create-ligne-bordereau.usecase';
import { GetLigneBordereauUseCase } from '../../../applications/usecase/ligne-bordereau/get-ligne-bordereau.usecase';
import { UpdateLigneBordereauUseCase } from '../../../applications/usecase/ligne-bordereau/update-ligne-bordereau.usecase';
import { DeleteLigneBordereauUseCase } from '../../../applications/usecase/ligne-bordereau/delete-ligne-bordereau.usecase';
// Commission Engine
import { CommissionEngineController } from './http/commission-engine.controller';
import { CommissionEngineService } from '../../services/commission-engine.service';
// Gamme
import { GammeController } from './http/gamme.controller';
import { GammeEntity } from '../../db/entities/gamme.entity';
import { TypeOrmGammeRepository } from '../../repositories/typeorm-gamme.repository';
import { CreateGammeUseCase } from '../../../applications/usecase/gamme/create-gamme.usecase';
import { GetGammeUseCase } from '../../../applications/usecase/gamme/get-gamme.usecase';
import { UpdateGammeUseCase } from '../../../applications/usecase/gamme/update-gamme.usecase';
import { DeleteGammeUseCase } from '../../../applications/usecase/gamme/delete-gamme.usecase';
// </plop:imports>

const TYPEORM_ENTITIES = [
  ClientBaseEntity,
  ClientEntrepriseEntity,
  RoleEntity,
  UtilisateurEntity,
  BoiteMailEntity,
  ProduitEntity,
  ClientPartenaireEntity,
  StatutContratEntity,
  ConditionPaiementEntity,
  TypeActiviteEntity,
  ContratEntity,
  LigneContratEntity,
  ActiviteEntity,
  AdresseEntity,
  HistoriqueStatutContratEntity,
  PieceJointeEntity,
  StatutFactureEntity,
  EmissionFactureEntity,
  FactureEntity,
  StatutPartenaireEntity,
  ModeleDistributionEntity,
  FacturationParEntity,
  PeriodeFacturationEntity,
  RolePartenaireEntity,
  StatutClientEntity,
  PartenaireMarqueBlancheEntity,
  ThemeMarqueEntity,
  GrilleTarifaireEntity,
  PrixProduitEntity,
  MembrePartenaireEntity,
  CompteEntity,
  PermissionEntity,
  RolePermissionEntity,
  MembreOrganisationEntity,
  InvitationCompteEntity,
  GroupeEntity,
  SocieteEntity,
  GroupeEntiteEntity,
  MembreGroupeEntity,
  AffectationGroupeClientEntity,
  TransporteurCompteEntity,
  ExpeditionEntity,
  ColisEntity,
  EvenementSuiviEntity,
  ContractOrchestrationHistoryEntity,
  OrganisationEntity,
  NotificationEntity,
  ApporteurEntity,
  StatutCommissionEntity,
  CommissionEntity,
  BaremeCommissionEntity,
  PalierCommissionEntity,
  RepriseCommissionEntity,
  BordereauCommissionEntity,
  LigneBordereauEntity,
  GammeEntity,
];
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KeycloakModule,
    SecurityModule,
    // <plop:modules>

    ...(process.env.DB_TYPE === 'postgres'
      ? ([
          TypeOrmModule.forRoot(databaseConfig),

          TypeOrmModule.forFeature(TYPEORM_ENTITIES),
        ] as DynamicModule[])
      : []),
    // </plop:modules>
  ],
  controllers: [
    AppController,
    // <plop:controllers>
    AuthController,
    OrganisationController,
    AiController,
    ClientBaseController,
    ClientEntrepriseController,
    RoleController,
    UtilisateurController,
    BoiteMailController,
    OAuthController,
    ProduitController,
    ClientPartenaireController,
    StatutContratController,
    ConditionPaiementController,
    TypeActiviteController,
    ContratController,
    LigneContratController,
    ActiviteController,
    AdresseController,
    HistoriqueStatutContratController,
    PieceJointeController,
    StatutFactureController,
    EmissionFactureController,
    FactureController,
    StatutPartenaireController,
    ModeleDistributionController,
    FacturationParController,
    PeriodeFacturationController,
    RolePartenaireController,
    StatutClientController,
    PartenaireMarqueBlancheController,
    ThemeMarqueController,
    GrilleTarifaireController,
    PrixProduitController,
    MembrePartenaireController,
    CompteController,
    PermissionController,
    RolePermissionController,
    MembreCompteController,
    InvitationCompteController,
    GroupeController,
    SocieteController,
    GroupeEntiteController,
    MembreGroupeController,
    AffectationGroupeClientController,
    TransporteurCompteController,
    ExpeditionController,
    ColisController,
    EvenementSuiviController,
    ContractOrchestrationController,
    LogisticsController,
    NotificationController,
    DashboardController,
    ApporteurController,
    StatutCommissionController,
    CommissionController,
    BaremeCommissionController,
    PalierCommissionController,
    RepriseCommissionController,
    BordereauCommissionController,
    LigneBordereauController,
    CommissionEngineController,
    GammeController,
    // </plop:controllers>
  ],
  providers: [
    // <plop:providers>
    // ============================================================
    // PROVIDERS ORGANISÉS PAR DOMAINE (92 providers en 7 lignes!)
    // ============================================================
    ...AUTH_PROVIDERS,
    ...CLIENT_PROVIDERS,
    ...CONTRACT_PROVIDERS,
    ...LOGISTICS_PROVIDERS,
    ...EMAIL_PROVIDERS,
    ...AI_PROVIDERS,
    ...PRODUCT_PROVIDERS,

    // ============================================================
    // PROVIDERS RESTANTS (à organiser dans de nouveaux fichiers)
    // ============================================================
    {
      provide: 'ActiviteRepositoryPort',
      useClass: TypeOrmActiviteRepository,
    },
    CreateActiviteUseCase,
    GetActiviteUseCase,
    UpdateActiviteUseCase,
    DeleteActiviteUseCase,
    {
      provide: 'AdresseRepositoryPort',
      useClass: TypeOrmAdresseRepository,
    },
    CreateAdresseUseCase,
    GetAdresseUseCase,
    UpdateAdresseUseCase,
    DeleteAdresseUseCase,
    {
      provide: 'HistoriqueStatutContratRepositoryPort',
      useClass: TypeOrmHistoriqueStatutContratRepository,
    },
    CreateHistoriqueStatutContratUseCase,
    GetHistoriqueStatutContratUseCase,
    UpdateHistoriqueStatutContratUseCase,
    DeleteHistoriqueStatutContratUseCase,
    {
      provide: 'PieceJointeRepositoryPort',
      useClass: TypeOrmPieceJointeRepository,
    },
    CreatePieceJointeUseCase,
    GetPieceJointeUseCase,
    UpdatePieceJointeUseCase,
    DeletePieceJointeUseCase,
    {
      provide: 'FactureRepositoryPort',
      useClass: TypeOrmFactureRepository,
    },
    CreateFactureUseCase,
    GetFactureUseCase,
    UpdateFactureUseCase,
    DeleteFactureUseCase,
    {
      provide: 'StatutFactureRepositoryPort',
      useClass: TypeOrmStatutFactureRepository,
    },
    CreateStatutFactureUseCase,
    GetStatutFactureUseCase,
    UpdateStatutFactureUseCase,
    DeleteStatutFactureUseCase,
    {
      provide: 'EmissionFactureRepositoryPort',
      useClass: TypeOrmEmissionFactureRepository,
    },
    CreateEmissionFactureUseCase,
    GetEmissionFactureUseCase,
    UpdateEmissionFactureUseCase,
    DeleteEmissionFactureUseCase,
    {
      provide: 'StatutPartenaireRepositoryPort',
      useClass: TypeOrmStatutPartenaireRepository,
    },
    CreateStatutPartenaireUseCase,
    GetStatutPartenaireUseCase,
    UpdateStatutPartenaireUseCase,
    DeleteStatutPartenaireUseCase,
    {
      provide: 'ModeleDistributionRepositoryPort',
      useClass: TypeOrmModeleDistributionRepository,
    },
    CreateModeleDistributionUseCase,
    GetModeleDistributionUseCase,
    UpdateModeleDistributionUseCase,
    DeleteModeleDistributionUseCase,
    {
      provide: 'FacturationParRepositoryPort',
      useClass: TypeOrmFacturationParRepository,
    },
    CreateFacturationParUseCase,
    GetFacturationParUseCase,
    UpdateFacturationParUseCase,
    DeleteFacturationParUseCase,
    {
      provide: 'PeriodeFacturationRepositoryPort',
      useClass: TypeOrmPeriodeFacturationRepository,
    },
    CreatePeriodeFacturationUseCase,
    GetPeriodeFacturationUseCase,
    UpdatePeriodeFacturationUseCase,
    DeletePeriodeFacturationUseCase,
    {
      provide: 'RolePartenaireRepositoryPort',
      useClass: TypeOrmRolePartenaireRepository,
    },
    CreateRolePartenaireUseCase,
    GetRolePartenaireUseCase,
    UpdateRolePartenaireUseCase,
    DeleteRolePartenaireUseCase,
    {
      provide: 'StatutClientRepositoryPort',
      useClass: TypeOrmStatutClientRepository,
    },
    CreateStatutClientUseCase,
    GetStatutClientUseCase,
    UpdateStatutClientUseCase,
    DeleteStatutClientUseCase,
    {
      provide: 'PartenaireMarqueBlancheRepositoryPort',
      useClass: TypeOrmPartenaireMarqueBlancheRepository,
    },
    CreatePartenaireMarqueBlancheUseCase,
    GetPartenaireMarqueBlancheUseCase,
    UpdatePartenaireMarqueBlancheUseCase,
    DeletePartenaireMarqueBlancheUseCase,
    {
      provide: 'ThemeMarqueRepositoryPort',
      useClass: TypeOrmThemeMarqueRepository,
    },
    CreateThemeMarqueUseCase,
    GetThemeMarqueUseCase,
    UpdateThemeMarqueUseCase,
    DeleteThemeMarqueUseCase,
    {
      provide: 'GrilleTarifaireRepositoryPort',
      useClass: TypeOrmGrilleTarifaireRepository,
    },
    CreateGrilleTarifaireUseCase,
    GetGrilleTarifaireUseCase,
    UpdateGrilleTarifaireUseCase,
    DeleteGrilleTarifaireUseCase,
    {
      provide: 'PrixProduitRepositoryPort',
      useClass: TypeOrmPrixProduitRepository,
    },
    CreatePrixProduitUseCase,
    GetPrixProduitUseCase,
    UpdatePrixProduitUseCase,
    DeletePrixProduitUseCase,
    {
      provide: 'GroupeRepositoryPort',
      useClass: TypeOrmGroupeRepository,
    },
    CreateGroupeUseCase,
    GetGroupeUseCase,
    UpdateGroupeUseCase,
    DeleteGroupeUseCase,
    {
      provide: 'SocieteRepositoryPort',
      useClass: TypeOrmSocieteRepository,
    },
    CreateSocieteUseCase,
    GetSocieteUseCase,
    UpdateSocieteUseCase,
    DeleteSocieteUseCase,
    {
      provide: 'GroupeEntiteRepositoryPort',
      useClass: TypeOrmGroupeEntiteRepository,
    },
    CreateGroupeEntiteUseCase,
    GetGroupeEntiteUseCase,
    UpdateGroupeEntiteUseCase,
    DeleteGroupeEntiteUseCase,
    {
      provide: 'MembrePartenaireRepositoryPort',
      useClass: TypeOrmMembrePartenaireRepository,
    },
    CreateMembrePartenaireUseCase,
    GetMembrePartenaireUseCase,
    UpdateMembrePartenaireUseCase,
    DeleteMembrePartenaireUseCase,
    {
      provide: 'MembreGroupeRepositoryPort',
      useClass: TypeOrmMembreGroupeRepository,
    },
    CreateMembreGroupeUseCase,
    GetMembreGroupeUseCase,
    UpdateMembreGroupeUseCase,
    DeleteMembreGroupeUseCase,
    {
      provide: 'AffectationGroupeClientRepositoryPort',
      useClass: TypeOrmAffectationGroupeClientRepository,
    },
    CreateAffectationGroupeClientUseCase,
    GetAffectationGroupeClientUseCase,
    UpdateAffectationGroupeClientUseCase,
    DeleteAffectationGroupeClientUseCase,
    {
      provide: 'ContractOrchestrationHistoryRepositoryPort',
      useClass: TypeOrmContractOrchestrationHistoryRepository,
    },
    {
      provide: 'ContractOrchestrationPort',
      useClass: ContractOrchestrationService,
    },
    ActivateContractUseCase,
    SuspendContractUseCase,
    TerminateContractUseCase,
    PortInContractUseCase,
    {
      provide: 'CompteRepositoryPort',
      useClass: TypeOrmCompteRepository,
    },
    CreateCompteUseCase,
    GetCompteUseCase,
    UpdateCompteUseCase,
    DeleteCompteUseCase,
    {
      provide: 'PermissionRepositoryPort',
      useClass: TypeOrmPermissionRepository,
    },
    CreatePermissionUseCase,
    GetPermissionUseCase,
    UpdatePermissionUseCase,
    DeletePermissionUseCase,
    {
      provide: 'RolePermissionRepositoryPort',
      useClass: TypeOrmRolePermissionRepository,
    },
    CreateRolePermissionUseCase,
    GetRolePermissionUseCase,
    UpdateRolePermissionUseCase,
    DeleteRolePermissionUseCase,
    {
      provide: 'MembreCompteRepositoryPort',
      useClass: TypeOrmMembreCompteRepository,
    },
    CreateMembreCompteUseCase,
    GetMembreCompteUseCase,
    UpdateMembreCompteUseCase,
    DeleteMembreCompteUseCase,
    {
      provide: 'InvitationCompteRepositoryPort',
      useClass: TypeOrmInvitationCompteRepository,
    },
    CreateInvitationCompteUseCase,
    GetInvitationCompteUseCase,
    UpdateInvitationCompteUseCase,
    DeleteInvitationCompteUseCase,
    {
      provide: 'TransporteurCompteRepositoryPort',
      useClass: TypeOrmTransporteurCompteRepository,
    },
    CreateTransporteurCompteUseCase,
    GetTransporteurCompteUseCase,
    UpdateTransporteurCompteUseCase,
    DeleteTransporteurCompteUseCase,
    {
      provide: 'ExpeditionRepositoryPort',
      useClass: TypeOrmExpeditionRepository,
    },
    CreateExpeditionUseCase,
    GetExpeditionUseCase,
    GetExpeditionWithDetailsUseCase,
    UpdateExpeditionUseCase,
    DeleteExpeditionUseCase,
    {
      provide: 'ColisRepositoryPort',
      useClass: TypeOrmColisRepository,
    },
    CreateColisUseCase,
    GetColisUseCase,
    UpdateColisUseCase,
    DeleteColisUseCase,
    {
      provide: 'EvenementSuiviRepositoryPort',
      useClass: TypeOrmEvenementSuiviRepository,
    },
    CreateEvenementSuiviUseCase,
    GetEvenementSuiviUseCase,
    UpdateEvenementSuiviUseCase,
    DeleteEvenementSuiviUseCase,
    DatabaseService,
    {
      provide: 'OrganisationRepositoryPort',
      useClass: TypeOrmOrganisationRepository,
    },
    CreateOrganisationUseCase,
    GetOrganisationUseCase,
    UpdateOrganisationUseCase,
    DeleteOrganisationUseCase,
    // Notification providers
    {
      provide: 'NotificationRepositoryPort',
      useClass: TypeOrmNotificationRepository,
    },
    CreateNotificationUseCase,
    GetNotificationUseCase,
    UpdateNotificationUseCase,
    DeleteNotificationUseCase,
    NotificationGateway,
    NotificationService,
    // Dashboard use cases
    GetDashboardKpisUseCase,
    GetEvolutionCaUseCase,
    GetRepartitionProduitsUseCase,
    GetStatsSocietesUseCase,
    GetAlertesUseCase,
    GetKpisCommerciauxUseCase,
    // Apporteur providers
    {
      provide: 'ApporteurRepositoryPort',
      useClass: TypeOrmApporteurRepository,
    },
    CreateApporteurUseCase,
    GetApporteurUseCase,
    UpdateApporteurUseCase,
    DeleteApporteurUseCase,
    // StatutCommission providers
    {
      provide: 'StatutCommissionRepositoryPort',
      useClass: TypeOrmStatutCommissionRepository,
    },
    CreateStatutCommissionUseCase,
    GetStatutCommissionUseCase,
    UpdateStatutCommissionUseCase,
    DeleteStatutCommissionUseCase,
    // Commission providers
    {
      provide: 'CommissionRepositoryPort',
      useClass: TypeOrmCommissionRepository,
    },
    CreateCommissionUseCase,
    GetCommissionUseCase,
    GetCommissionWithDetailsUseCase,
    UpdateCommissionUseCase,
    DeleteCommissionUseCase,
    // BaremeCommission providers
    {
      provide: 'BaremeCommissionRepositoryPort',
      useClass: TypeOrmBaremeCommissionRepository,
    },
    CreateBaremeCommissionUseCase,
    GetBaremeCommissionUseCase,
    UpdateBaremeCommissionUseCase,
    DeleteBaremeCommissionUseCase,
    // PalierCommission providers
    {
      provide: 'PalierCommissionRepositoryPort',
      useClass: TypeOrmPalierCommissionRepository,
    },
    CreatePalierCommissionUseCase,
    GetPalierCommissionUseCase,
    UpdatePalierCommissionUseCase,
    DeletePalierCommissionUseCase,
    // RepriseCommission providers
    {
      provide: 'RepriseCommissionRepositoryPort',
      useClass: TypeOrmRepriseCommissionRepository,
    },
    CreateRepriseCommissionUseCase,
    GetRepriseCommissionUseCase,
    UpdateRepriseCommissionUseCase,
    DeleteRepriseCommissionUseCase,
    // BordereauCommission providers
    {
      provide: 'BordereauCommissionRepositoryPort',
      useClass: TypeOrmBordereauCommissionRepository,
    },
    CreateBordereauCommissionUseCase,
    GetBordereauCommissionUseCase,
    UpdateBordereauCommissionUseCase,
    DeleteBordereauCommissionUseCase,
    // LigneBordereau providers
    {
      provide: 'LigneBordereauRepositoryPort',
      useClass: TypeOrmLigneBordereauRepository,
    },
    CreateLigneBordereauUseCase,
    GetLigneBordereauUseCase,
    UpdateLigneBordereauUseCase,
    DeleteLigneBordereauUseCase,
    // Commission Engine Service
    CommissionEngineService,
    // Gamme providers
    {
      provide: 'GammeRepositoryPort',
      useClass: TypeOrmGammeRepository,
    },
    CreateGammeUseCase,
    GetGammeUseCase,
    UpdateGammeUseCase,
    DeleteGammeUseCase,
  ],
})
export class AppModule {}
