# Instructions Manuelles pour Simplifier app.module.ts

## ✅ Étape 1: Import (DÉJÀ FAIT)

L'import des providers groupés a été ajouté en haut du fichier.

## 🎯 Étape 2: Simplifier la Section Providers

### Localisation
La section `providers:` commence à la **ligne 483** de `app.module.ts`

### Action à Faire

**REMPLACEZ** tout le contenu entre la ligne 484 et la ligne avec `// </plop:providers>` par :

```typescript
    // ============================================================
    // PROVIDERS ORGANISÉS PAR DOMAINE (92 providers en 7 lignes!)
    // ============================================================
    ...AUTH_PROVIDERS,          // Utilisateur & Role (10 providers)
    ...CLIENT_PROVIDERS,         // Tous les clients (15 providers)
    ...CONTRACT_PROVIDERS,       // Contrats & lignes (25 providers)
    ...LOGISTICS_PROVIDERS,      // Expéditions & Maileva (25 providers)
    ...EMAIL_PROVIDERS,          // BoiteMail & OAuth (10 providers)
    ...AI_PROVIDERS,             // IA & LLM (2 providers)
    ...PRODUCT_PROVIDERS,        // Produits (5 providers)

    // ============================================================
    // PROVIDERS RESTANTS (à organiser dans de nouveaux fichiers)
    // ============================================================
    // TODO: Activité
    {
      provide: 'ActiviteRepositoryPort',
      useClass: TypeOrmActiviteRepository,
    },
    CreateActiviteUseCase,
    GetActiviteUseCase,
    UpdateActiviteUseCase,
    DeleteActiviteUseCase,

    // TODO: Adresse
    {
      provide: 'AdresseRepositoryPort',
      useClass: TypeOrmAdresseRepository,
    },
    CreateAdresseUseCase,
    GetAdresseUseCase,
    UpdateAdresseUseCase,
    DeleteAdresseUseCase,

    // TODO: Historique Statut Contrat
    {
      provide: 'HistoriqueStatutContratRepositoryPort',
      useClass: TypeOrmHistoriqueStatutContratRepository,
    },
    CreateHistoriqueStatutContratUseCase,
    GetHistoriqueStatutContratUseCase,
    UpdateHistoriqueStatutContratUseCase,
    DeleteHistoriqueStatutContratUseCase,

    // TODO: Pièce Jointe
    {
      provide: 'PieceJointeRepositoryPort',
      useClass: TypeOrmPieceJointeRepository,
    },
    CreatePieceJointeUseCase,
    GetPieceJointeUseCase,
    UpdatePieceJointeUseCase,
    DeletePieceJointeUseCase,

    // TODO: Facture
    {
      provide: 'FactureRepositoryPort',
      useClass: TypeOrmFactureRepository,
    },
    CreateFactureUseCase,
    GetFactureUseCase,
    UpdateFactureUseCase,
    DeleteFactureUseCase,

    // TODO: Statut Facture
    {
      provide: 'StatutFactureRepositoryPort',
      useClass: TypeOrmStatutFactureRepository,
    },
    CreateStatutFactureUseCase,
    GetStatutFactureUseCase,
    UpdateStatutFactureUseCase,
    DeleteStatutFactureUseCase,

    // TODO: Emission Facture
    {
      provide: 'EmissionFactureRepositoryPort',
      useClass: TypeOrmEmissionFactureRepository,
    },
    CreateEmissionFactureUseCase,
    GetEmissionFactureUseCase,
    UpdateEmissionFactureUseCase,
    DeleteEmissionFactureUseCase,

    // TODO: Statut Partenaire
    {
      provide: 'StatutPartenaireRepositoryPort',
      useClass: TypeOrmStatutPartenaireRepository,
    },
    CreateStatutPartenaireUseCase,
    GetStatutPartenaireUseCase,
    UpdateStatutPartenaireUseCase,
    DeleteStatutPartenaireUseCase,

    // TODO: Modèle Distribution
    {
      provide: 'ModeleDistributionRepositoryPort',
      useClass: TypeOrmModeleDistributionRepository,
    },
    CreateModeleDistributionUseCase,
    GetModeleDistributionUseCase,
    UpdateModeleDistributionUseCase,
    DeleteModeleDistributionUseCase,

    // TODO: Facturation Par
    {
      provide: 'FacturationParRepositoryPort',
      useClass: TypeOrmFacturationParRepository,
    },
    CreateFacturationParUseCase,
    GetFacturationParUseCase,
    UpdateFacturationParUseCase,
    DeleteFacturationParUseCase,

    // TODO: Période Facturation
    {
      provide: 'PeriodeFacturationRepositoryPort',
      useClass: TypeOrmPeriodeFacturationRepository,
    },
    CreatePeriodeFacturationUseCase,
    GetPeriodeFacturationUseCase,
    UpdatePeriodeFacturationUseCase,
    DeletePeriodeFacturationUseCase,

    // TODO: Role Partenaire
    {
      provide: 'RolePartenaireRepositoryPort',
      useClass: TypeOrmRolePartenaireRepository,
    },
    CreateRolePartenaireUseCase,
    GetRolePartenaireUseCase,
    UpdateRolePartenaireUseCase,
    DeleteRolePartenaireUseCase,

    // TODO: Statut Client
    {
      provide: 'StatutClientRepositoryPort',
      useClass: TypeOrmStatutClientRepository,
    },
    CreateStatutClientUseCase,
    GetStatutClientUseCase,
    UpdateStatutClientUseCase,
    DeleteStatutClientUseCase,

    // TODO: Partenaire Marque Blanche
    {
      provide: 'PartenaireMarqueBlancheRepositoryPort',
      useClass: TypeOrmPartenaireMarqueBlancheRepository,
    },
    CreatePartenaireMarqueBlancheUseCase,
    GetPartenaireMarqueBlancheUseCase,
    UpdatePartenaireMarqueBlancheUseCase,
    DeletePartenaireMarqueBlancheUseCase,

    // TODO: Theme Marque
    {
      provide: 'ThemeMarqueRepositoryPort',
      useClass: TypeOrmThemeMarqueRepository,
    },
    CreateThemeMarqueUseCase,
    GetThemeMarqueUseCase,
    UpdateThemeMarqueUseCase,
    DeleteThemeMarqueUseCase,

    // TODO: Grille Tarifaire
    {
      provide: 'GrilleTarifaireRepositoryPort',
      useClass: TypeOrmGrilleTarifaireRepository,
    },
    CreateGrilleTarifaireUseCase,
    GetGrilleTarifaireUseCase,
    UpdateGrilleTarifaireUseCase,
    DeleteGrilleTarifaireUseCase,

    // TODO: Prix Produit
    {
      provide: 'PrixProduitRepositoryPort',
      useClass: TypeOrmPrixProduitRepository,
    },
    CreatePrixProduitUseCase,
    GetPrixProduitUseCase,
    UpdatePrixProduitUseCase,
    DeletePrixProduitUseCase,

    // TODO: Groupe
    {
      provide: 'GroupeRepositoryPort',
      useClass: TypeOrmGroupeRepository,
    },
    CreateGroupeUseCase,
    GetGroupeUseCase,
    UpdateGroupeUseCase,
    DeleteGroupeUseCase,

    // TODO: Société
    {
      provide: 'SocieteRepositoryPort',
      useClass: TypeOrmSocieteRepository,
    },
    CreateSocieteUseCase,
    GetSocieteUseCase,
    UpdateSocieteUseCase,
    DeleteSocieteUseCase,

    // TODO: Groupe Société
    {
      provide: 'GroupeSocieteRepositoryPort',
      useClass: TypeOrmGroupeSocieteRepository,
    },
    CreateGroupeSocieteUseCase,
    GetGroupeSocieteUseCase,
    UpdateGroupeSocieteUseCase,
    DeleteGroupeSocieteUseCase,

    // TODO: Membre Partenaire
    {
      provide: 'MembrePartenaireRepositoryPort',
      useClass: TypeOrmMembrePartenaireRepository,
    },
    CreateMembrePartenaireUseCase,
    GetMembrePartenaireUseCase,
    UpdateMembrePartenaireUseCase,
    DeleteMembrePartenaireUseCase,

    // TODO: Membre Groupe
    {
      provide: 'MembreGroupeRepositoryPort',
      useClass: TypeOrmMembreGroupeRepository,
    },
    CreateMembreGroupeUseCase,
    GetMembreGroupeUseCase,
    UpdateMembreGroupeUseCase,
    DeleteMembreGroupeUseCase,

    // TODO: Affectation Groupe Client
    {
      provide: 'AffectationGroupeClientRepositoryPort',
      useClass: TypeOrmAffectationGroupeClientRepository,
    },
    CreateAffectationGroupeClientUseCase,
    GetAffectationGroupeClientUseCase,
    UpdateAffectationGroupeClientUseCase,
    DeleteAffectationGroupeClientUseCase,

    // TODO: Contract Orchestration
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

    // </plop:providers>
```

## ✅ Étape 3: Tester

```bash
npm run build
```

Si tout compile, félicitations ! Vous avez réduit votre app.module.ts de **857 lignes à ~450 lignes** !

## 📊 Résultat

**AVANT** : 857 lignes
**APRÈS** : ~450 lignes

**Réduction** : ~48% (400 lignes économisées)

Les 92 providers les plus courants sont maintenant dans 7 lignes au lieu de 350+.

## 🚀 Prochaines Étapes (Optionnel)

Créez des fichiers providers pour les domaines restants :
- `invoice.providers.ts` - Factures
- `organization.providers.ts` - Groupes & Sociétés
- `white-label.providers.ts` - Marque Blanche
- `activity.providers.ts` - Activités

Chaque fichier providers réduira encore plus `app.module.ts` !

Objectif final : < 150 lignes 🎯