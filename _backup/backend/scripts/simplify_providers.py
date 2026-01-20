#!/usr/bin/env python3
"""
Script pour simplifier la section providers de app.module.ts
"""

import re

# Lire le fichier
with open('src/infrastructure/framework/nest/app.module.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix le "n" en trop
content = content.replace('\nn//', '\n//')

# Trouver la section providers
providers_pattern = r'(providers:\s*\[)(.*?)(\s*// </plop:providers>)'
match = re.search(providers_pattern, content, re.DOTALL)

if match:
    print("✅ Section providers trouvée")

    # Nouveau contenu providers
    new_providers = '''
    // ============================================================
    // PROVIDERS ORGANISÉS PAR DOMAINE (92 providers en 7 lignes!)
    // ============================================================
    ...AUTH_PROVIDERS,          // ✅ Utilisateur & Role (10 providers)
    ...CLIENT_PROVIDERS,         // ✅ Tous les clients (15 providers)
    ...CONTRACT_PROVIDERS,       // ✅ Contrats & lignes (25 providers)
    ...LOGISTICS_PROVIDERS,      // ✅ Expéditions & Maileva (25 providers)
    ...EMAIL_PROVIDERS,          // ✅ BoiteMail & OAuth (10 providers)
    ...AI_PROVIDERS,             // ✅ IA & LLM (2 providers)
    ...PRODUCT_PROVIDERS,        // ✅ Produits (5 providers)

    // ============================================================
    // PROVIDERS RESTANTS (à organiser dans de nouveaux fichiers)
    // ============================================================
    // TODO: Créer des fichiers providers pour ces domaines :
    // - invoice.providers.ts (Facture, StatutFacture, etc.)
    // - organization.providers.ts (Groupe, Société, Membre, etc.)
    // - white-label.providers.ts (PartenaireMarqueBlanche, Theme, etc.)
    // - activity.providers.ts (Activite, PieceJointe, etc.)
'''

    # Garder les providers qui ne sont pas encore groupés
    old_providers = match.group(2)

    # Providers à exclure (déjà dans les groupes)
    excluded_providers = [
        'GenerateTextUseCase', 'LlmGrpcClient', 'LLM_PORT',
        'CreateClientBaseUseCase', 'GetClientBaseUseCase', 'UpdateClientBaseUseCase', 'DeleteClientBaseUseCase',
        'ClientBaseRepositoryPort', 'TypeOrmClientBaseRepository',
        'CreateClientEntrepriseUseCase', 'GetClientEntrepriseUseCase', 'UpdateClientEntrepriseUseCase', 'DeleteClientEntrepriseUseCase',
        'ClientEntrepriseRepositoryPort', 'TypeOrmClientEntrepriseRepository',
        'CreateRoleUseCase', 'GetRoleUseCase', 'UpdateRoleUseCase', 'DeleteRoleUseCase',
        'RoleRepositoryPort', 'TypeOrmRoleRepository',
        'CreateUtilisateurUseCase', 'GetUtilisateurUseCase', 'UpdateUtilisateurUseCase', 'DeleteUtilisateurUseCase',
        'UtilisateurRepositoryPort', 'TypeOrmUtilisateurRepository',
        'CreateBoiteMailUseCase', 'GetBoiteMailUseCase', 'UpdateBoiteMailUseCase', 'DeleteBoiteMailUseCase',
        'BoiteMailRepositoryPort', 'TypeOrmBoiteMailRepository',
        'GoogleOAuthService', 'MicrosoftOAuthService',
        'GetOAuthAuthorizationUrlUseCase', 'ExchangeOAuthCodeUseCase', 'RefreshOAuthTokenUseCase',
        'CreateProduitUseCase', 'GetProduitUseCase', 'UpdateProduitUseCase', 'DeleteProduitUseCase',
        'ProduitRepositoryPort', 'TypeOrmProduitRepository',
        'CreateClientPartenaireUseCase', 'GetClientPartenaireUseCase', 'UpdateClientPartenaireUseCase', 'DeleteClientPartenaireUseCase',
        'ClientPartenaireRepositoryPort', 'TypeOrmClientPartenaireRepository',
        'CreateStatutContratUseCase', 'GetStatutContratUseCase', 'UpdateStatutContratUseCase', 'DeleteStatutContratUseCase',
        'StatutContratRepositoryPort', 'TypeOrmStatutContratRepository',
        'CreateConditionPaiementUseCase', 'GetConditionPaiementUseCase', 'UpdateConditionPaiementUseCase', 'DeleteConditionPaiementUseCase',
        'ConditionPaiementRepositoryPort', 'TypeOrmConditionPaiementRepository',
        'CreateTypeActiviteUseCase', 'GetTypeActiviteUseCase', 'UpdateTypeActiviteUseCase', 'DeleteTypeActiviteUseCase',
        'TypeActiviteRepositoryPort', 'TypeOrmTypeActiviteRepository',
        'CreateContratUseCase', 'GetContratUseCase', 'UpdateContratUseCase', 'DeleteContratUseCase',
        'ContratRepositoryPort', 'TypeOrmContratRepository',
        'CreateLigneContratUseCase', 'GetLigneContratUseCase', 'UpdateLigneContratUseCase', 'DeleteLigneContratUseCase',
        'LigneContratRepositoryPort', 'TypeOrmLigneContratRepository',
        'CreateExpeditionUseCase', 'GetExpeditionUseCase', 'UpdateExpeditionUseCase', 'DeleteExpeditionUseCase',
        'ExpeditionRepositoryPort', 'TypeOrmExpeditionRepository',
        'CreateColisUseCase', 'GetColisUseCase', 'UpdateColisUseCase', 'DeleteColisUseCase',
        'ColisRepositoryPort', 'TypeOrmColisRepository',
        'CreateEvenementSuiviUseCase', 'GetEvenementSuiviUseCase', 'UpdateEvenementSuiviUseCase', 'DeleteEvenementSuiviUseCase',
        'EvenementSuiviRepositoryPort', 'TypeOrmEvenementSuiviRepository',
        'CreateTransporteurCompteUseCase', 'GetTransporteurCompteUseCase', 'UpdateTransporteurCompteUseCase', 'DeleteTransporteurCompteUseCase',
        'TransporteurCompteRepositoryPort', 'TypeOrmTransporteurCompteRepository',
        'GenerateLabelUseCase', 'TrackShipmentUseCase', 'ValidateAddressUseCase', 'SimulatePricingUseCase',
        'LogisticsProviderPort', 'MailevaLogisticsService',
    ]

    # Filtrer les providers restants
    remaining_providers = []
    for line in old_providers.split('\n'):
        line = line.strip()
        if line and not any(excluded in line for excluded in excluded_providers):
            remaining_providers.append('    ' + line)

    if remaining_providers:
        new_providers += '\n    ' + '\n    '.join(remaining_providers) + '\n    '

    # Remplacer
    new_content = content[:match.start()] + match.group(1) + new_providers + match.group(3) + content[match.end():]

    # Écrire
    with open('src/infrastructure/framework/nest/app.module.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"✅ Providers simplifiés!")
    print(f"📊 Providers restants à organiser: {len(remaining_providers)}")
else:
    print("❌ Section providers non trouvée")
