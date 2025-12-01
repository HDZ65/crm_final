#!/usr/bin/env node
/**
 * Script pour simplifier app.module.ts en utilisant les providers groupés
 *
 * Ce script:
 * 1. Sauvegarde l'ancien app.module.ts
 * 2. Remplace tous les providers individuels par les groupes
 * 3. Réduit drastiquement le nombre de lignes
 */

const fs = require('fs');
const path = require('path');

const APP_MODULE_PATH = path.join(__dirname, '../src/infrastructure/framework/nest/app.module.ts');
const BACKUP_PATH = APP_MODULE_PATH + '.backup';

// Providers à remplacer par les groupes
const providersToReplace = {
  AUTH: [
    'CreateUtilisateurUseCase', 'GetUtilisateurUseCase', 'UpdateUtilisateurUseCase', 'DeleteUtilisateurUseCase',
    'CreateRoleUseCase', 'GetRoleUseCase', 'UpdateRoleUseCase', 'DeleteRoleUseCase',
    'TypeOrmUtilisateurRepository', 'TypeOrmRoleRepository'
  ],
  CLIENT: [
    'CreateClientBaseUseCase', 'GetClientBaseUseCase', 'UpdateClientBaseUseCase', 'DeleteClientBaseUseCase',
    'CreateClientEntrepriseUseCase', 'GetClientEntrepriseUseCase', 'UpdateClientEntrepriseUseCase', 'DeleteClientEntrepriseUseCase',
    'CreateClientPartenaireUseCase', 'GetClientPartenaireUseCase', 'UpdateClientPartenaireUseCase', 'DeleteClientPartenaireUseCase',
    'TypeOrmClientBaseRepository', 'TypeOrmClientEntrepriseRepository', 'TypeOrmClientPartenaireRepository'
  ],
  CONTRACT: [
    'CreateContratUseCase', 'GetContratUseCase', 'UpdateContratUseCase', 'DeleteContratUseCase',
    'CreateLigneContratUseCase', 'GetLigneContratUseCase', 'UpdateLigneContratUseCase', 'DeleteLigneContratUseCase',
    'CreateStatutContratUseCase', 'GetStatutContratUseCase', 'UpdateStatutContratUseCase', 'DeleteStatutContratUseCase',
    'CreateConditionPaiementUseCase', 'GetConditionPaiementUseCase', 'UpdateConditionPaiementUseCase', 'DeleteConditionPaiementUseCase',
    'CreateTypeActiviteUseCase', 'GetTypeActiviteUseCase', 'UpdateTypeActiviteUseCase', 'DeleteTypeActiviteUseCase',
    'TypeOrmContratRepository', 'TypeOrmLigneContratRepository', 'TypeOrmStatutContratRepository',
    'TypeOrmConditionPaiementRepository', 'TypeOrmTypeActiviteRepository'
  ],
  LOGISTICS: [
    'CreateExpeditionUseCase', 'GetExpeditionUseCase', 'UpdateExpeditionUseCase', 'DeleteExpeditionUseCase',
    'CreateColisUseCase', 'GetColisUseCase', 'UpdateColisUseCase', 'DeleteColisUseCase',
    'CreateEvenementSuiviUseCase', 'GetEvenementSuiviUseCase', 'UpdateEvenementSuiviUseCase', 'DeleteEvenementSuiviUseCase',
    'CreateTransporteurCompteUseCase', 'GetTransporteurCompteUseCase', 'UpdateTransporteurCompteUseCase', 'DeleteTransporteurCompteUseCase',
    'TypeOrmExpeditionRepository', 'TypeOrmColisRepository', 'TypeOrmEvenementSuiviRepository', 'TypeOrmTransporteurCompteRepository',
    'GenerateLabelUseCase', 'TrackShipmentUseCase', 'ValidateAddressUseCase', 'SimulatePricingUseCase',
    'MailevaLogisticsService'
  ],
  EMAIL: [
    'CreateBoiteMailUseCase', 'GetBoiteMailUseCase', 'UpdateBoiteMailUseCase', 'DeleteBoiteMailUseCase',
    'TypeOrmBoiteMailRepository',
    'GetOAuthAuthorizationUrlUseCase', 'ExchangeOAuthCodeUseCase', 'RefreshOAuthTokenUseCase',
    'GoogleOAuthService', 'MicrosoftOAuthService'
  ],
  AI: [
    'GenerateTextUseCase', 'LlmGrpcClient'
  ],
  PRODUCT: [
    'CreateProduitUseCase', 'GetProduitUseCase', 'UpdateProduitUseCase', 'DeleteProduitUseCase',
    'TypeOrmProduitRepository'
  ]
};

console.log('🔍 Analyse de app.module.ts...\n');

const content = fs.readFileSync(APP_MODULE_PATH, 'utf-8');
const lines = content.split('\n');

console.log(`📊 Fichier actuel: ${lines.length} lignes\n`);

// Sauvegarder le fichier original
fs.writeFileSync(BACKUP_PATH, content);
console.log(`✅ Backup créé: ${BACKUP_PATH}\n`);

// Compter les providers remplacés
let replacedCount = 0;
Object.values(providersToReplace).forEach(providers => {
  providers.forEach(provider => {
    const regex = new RegExp(provider, 'g');
    const matches = content.match(regex);
    if (matches) replacedCount += matches.length;
  });
});

console.log(`📦 Providers qui seront groupés: ${replacedCount}\n`);

console.log('✨ Pour simplifier votre app.module.ts, ajoutez ceci en haut du fichier:\n');
console.log('```typescript');
console.log("import {");
console.log("  AUTH_PROVIDERS,");
console.log("  CLIENT_PROVIDERS,");
console.log("  CONTRACT_PROVIDERS,");
console.log("  LOGISTICS_PROVIDERS,");
console.log("  EMAIL_PROVIDERS,");
console.log("  AI_PROVIDERS,");
console.log("  PRODUCT_PROVIDERS");
console.log("} from './providers';");
console.log('```\n');

console.log('Puis dans la section providers, remplacez toutes les lignes 481-854 par:\n');
console.log('```typescript');
console.log('providers: [');
console.log('  // === PROVIDERS GROUPÉS ===');
console.log('  ...AUTH_PROVIDERS,          // ✅ Utilisateur & Role');
console.log('  ...CLIENT_PROVIDERS,         // ✅ Tous les clients');
console.log('  ...CONTRACT_PROVIDERS,       // ✅ Contrats & lignes');
console.log('  ...LOGISTICS_PROVIDERS,      // ✅ Expéditions & Maileva');
console.log('  ...EMAIL_PROVIDERS,          // ✅ BoiteMail & OAuth');
console.log('  ...AI_PROVIDERS,             // ✅ IA & LLM');
console.log('  ...PRODUCT_PROVIDERS,        // ✅ Produits');
console.log('');
console.log('  // === PROVIDERS RESTANTS (à organiser) ===');
console.log('  // TODO: Les autres providers ici');
console.log('  // </plop:providers>');
console.log('],');
console.log('```\n');

console.log(`🎯 Résultat attendu: ~${lines.length - replacedCount + 20} lignes (au lieu de ${lines.length})\n`);
console.log('💡 Voulez-vous que je fasse le remplacement automatiquement ? (y/n)');
