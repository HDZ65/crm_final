#!/usr/bin/env ts-node
/**
 * Script pour réorganiser app.module.ts en modules séparés
 *
 * Ce script analyse app.module.ts et crée automatiquement des modules
 * organisés par domaine métier.
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_MODULE_PATH = path.join(__dirname, '../src/infrastructure/framework/nest/app.module.ts');
const MODULES_DIR = path.join(__dirname, '../src/infrastructure/framework/nest/modules');

interface ModuleGroup {
  name: string;
  entities: string[];
  controllers: string[];
  useCases: string[];
  repositories: string[];
  services: string[];
}

// Définir les groupes de modules par domaine
const moduleGroups: Record<string, ModuleGroup> = {
  auth: {
    name: 'AuthModule',
    entities: ['Utilisateur', 'Role'],
    controllers: ['Utilisateur', 'Role'],
    useCases: ['Utilisateur', 'Role'],
    repositories: ['Utilisateur', 'Role'],
    services: []
  },
  client: {
    name: 'ClientModule',
    entities: ['ClientBase', 'ClientEntreprise', 'ClientPartenaire'],
    controllers: ['ClientBase', 'ClientEntreprise', 'ClientPartenaire'],
    useCases: ['ClientBase', 'ClientEntreprise', 'ClientPartenaire'],
    repositories: ['ClientBase', 'ClientEntreprise', 'ClientPartenaire'],
    services: []
  },
  contract: {
    name: 'ContractModule',
    entities: ['Contrat', 'LigneContrat', 'StatutContrat', 'ConditionPaiement', 'TypeActivite'],
    controllers: ['Contrat', 'LigneContrat', 'StatutContrat', 'ConditionPaiement', 'TypeActivite'],
    useCases: ['Contrat', 'LigneContrat', 'StatutContrat', 'ConditionPaiement', 'TypeActivite'],
    repositories: ['Contrat', 'LigneContrat', 'StatutContrat', 'ConditionPaiement', 'TypeActivite'],
    services: []
  },
  logistics: {
    name: 'LogisticsModule',
    entities: ['Expedition', 'Colis', 'EvenementSuivi', 'TransporteurCompte'],
    controllers: ['Expedition', 'Colis', 'EvenementSuivi', 'TransporteurCompte'],
    useCases: ['Expedition', 'Colis', 'EvenementSuivi', 'TransporteurCompte'],
    repositories: ['Expedition', 'Colis', 'EvenementSuivi', 'TransporteurCompte'],
    services: ['MailevaLogistics']
  },
  email: {
    name: 'EmailModule',
    entities: ['BoiteMail'],
    controllers: ['BoiteMail', 'OAuth'],
    useCases: ['BoiteMail', 'OAuth'],
    repositories: ['BoiteMail'],
    services: ['GoogleOAuth', 'MicrosoftOAuth']
  },
  ai: {
    name: 'AiModule',
    entities: [],
    controllers: ['Ai'],
    useCases: ['GenerateText'],
    repositories: [],
    services: ['LlmGrpcClient']
  }
};

function generateModuleContent(group: ModuleGroup, imports: string[]): string {
  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Imports extraits de app.module.ts
${imports.join('\n')}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Entities du module ${group.name}
      ${group.entities.map(e => `${e}Entity`).join(',\n      ')}
    ]),
  ],
  controllers: [
    // Controllers du module ${group.name}
    ${group.controllers.map(c => `${c}Controller`).join(',\n    ')}
  ],
  providers: [
    // Use Cases
    ${group.useCases.flatMap(uc => [
      `Create${uc}UseCase`,
      `Get${uc}UseCase`,
      `Update${uc}UseCase`,
      `Delete${uc}UseCase`
    ]).join(',\n    ')},

    // Repositories
    ${group.repositories.map(r => `{
      provide: '${r}RepositoryPort',
      useClass: TypeOrm${r}Repository,
    }`).join(',\n    ')},

    // Services
    ${group.services.join(',\n    ')}
  ],
  exports: [
    // Exporter ce qui peut être utilisé par d'autres modules
    ${group.repositories.map(r => `'${r}RepositoryPort'`).join(',\n    ')}
  ],
})
export class ${group.name} {}
`;
}

async function main() {
  console.log('🔍 Analyse de app.module.ts...');

  const content = fs.readFileSync(APP_MODULE_PATH, 'utf-8');
  const lines = content.split('\n');

  // Extraire les imports
  const imports = lines.filter(line => line.trim().startsWith('import'));

  console.log(`📊 Trouvé ${imports.length} imports`);

  // Créer le dossier modules s'il n'existe pas
  if (!fs.existsSync(MODULES_DIR)) {
    fs.mkdirSync(MODULES_DIR, { recursive: true });
  }

  // Générer chaque module
  for (const [key, group] of Object.entries(moduleGroups)) {
    console.log(`\n📦 Création du module: ${group.name}`);

    const moduleDir = path.join(MODULES_DIR, key);
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true });
    }

    // Filtrer les imports pertinents pour ce module
    const relevantImports = imports.filter(imp => {
      return group.entities.some(e => imp.includes(e)) ||
             group.controllers.some(c => imp.includes(c)) ||
             group.useCases.some(uc => imp.includes(uc)) ||
             group.repositories.some(r => imp.includes(r));
    });

    const moduleContent = generateModuleContent(group, relevantImports);
    const modulePath = path.join(moduleDir, `${key}.module.ts`);

    fs.writeFileSync(modulePath, moduleContent);
    console.log(`   ✅ ${modulePath}`);
  }

  console.log('\n✨ Modules créés avec succès!');
  console.log('\n📝 Prochaines étapes:');
  console.log('1. Vérifier les imports générés dans chaque module');
  console.log('2. Ajuster si nécessaire');
  console.log('3. Créer un nouveau app.module.ts qui importe ces modules');
  console.log('4. Tester avec: npm run start:dev');
}

main().catch(console.error);
