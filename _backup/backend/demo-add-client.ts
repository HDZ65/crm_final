#!/usr/bin/env ts-node
/**
 * Demo: Ajout d'un client dans la base de données via MCP
 *
 * Ce script montre comment:
 * 1. Se connecter au serveur MCP
 * 2. Créer un nouveau client
 * 3. Vérifier qu'il a été ajouté
 * 4. Le récupérer par son ID
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

async function demo() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║      DEMO: Ajout d\'un client dans PostgreSQL         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // 1. Charger le proto et se connecter
  console.log('📡 Connexion au serveur MCP...');
  const PROTO_PATH = join(__dirname, 'proto/mcp.proto');
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
  const mcpProto = protoDescriptor.mcp;

  const client = new mcpProto.MCPService(
    'localhost:50052',
    grpc.credentials.createInsecure()
  );

  console.log('✅ Connecté au serveur MCP sur localhost:50052\n');

  // 2. Créer un nouveau client
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Création d\'un nouveau client...\n');

  const now = new Date().toISOString();
  // Utiliser un UUID valide pour le compte (format UUID v4)
  const compteId = '123e4567-e89b-12d3-a456-426614174000';

  const clientData = {
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '+33612345678',
    typeClient: 'particulier',
    statutId: 'actif',
    compteCode: 'DEMO-001',
    partenaireId: 'partenaire-demo',
    dateCreation: now,
  };

  console.log('Données du client:');
  console.log(`  Nom: ${clientData.prenom} ${clientData.nom}`);
  console.log(`  Téléphone: ${clientData.telephone}`);
  console.log(`  Type: ${clientData.typeClient}`);
  console.log(`  Statut: ${clientData.statutId}`);
  console.log(`  Code compte: ${clientData.compteCode}`);
  console.log(`  Date création: ${clientData.dateCreation}\n`);

  const createResult = await new Promise<any>((resolve, reject) => {
    client.ExecuteTool(
      {
        tool_name: 'create_client',
        input: JSON.stringify(clientData),
        request_id: 'demo-create-client',
        compte_id: compteId,
      },
      (error: any, response: any) => {
        if (error) {
          reject(error);
        } else if (!response.success) {
          reject(new Error(response.error));
        } else {
          resolve(JSON.parse(response.result));
        }
      }
    );
  });

  console.log('✅ Client créé avec succès!');
  console.log(`   ID: ${createResult.id}`);
  console.log(`   Nom complet: ${createResult.prenom} ${createResult.nom}`);
  console.log(`   Téléphone: ${createResult.telephone}\n`);

  // 3. Vérifier qu'il a été ajouté en listant les clients
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Recherche de tous les clients...\n');

  const searchResult = await new Promise<any>((resolve, reject) => {
    client.ExecuteTool(
      {
        tool_name: 'search_clients',
        input: JSON.stringify({ limit: 10, offset: 0 }),
        request_id: 'demo-search-clients',
        compte_id: compteId,
      },
      (error: any, response: any) => {
        if (error) {
          reject(error);
        } else if (!response.success) {
          reject(new Error(response.error));
        } else {
          resolve(JSON.parse(response.result));
        }
      }
    );
  });

  console.log(`✅ Trouvé ${searchResult.total} client(s):\n`);
  searchResult.items.forEach((item: any, index: number) => {
    console.log(`   ${index + 1}. ${item.prenom} ${item.nom} (${item.telephone})`);
    console.log(`      ID: ${item.id}`);
    console.log(`      Statut: ${item.statutId}`);
    console.log(`      Type: ${item.typeClient}\n`);
  });

  // 4. Récupérer le client par son ID
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔎 Récupération du client par ID: ${createResult.id}...\n`);

  const getResult = await new Promise<any>((resolve, reject) => {
    client.ExecuteTool(
      {
        tool_name: 'get_client',
        input: JSON.stringify({ id: createResult.id }),
        request_id: 'demo-get-client',
        compte_id: compteId,
      },
      (error: any, response: any) => {
        if (error) {
          reject(error);
        } else if (!response.success) {
          reject(new Error(response.error));
        } else {
          resolve(JSON.parse(response.result));
        }
      }
    );
  });

  console.log('✅ Client récupéré avec succès!');
  console.log('\nDétails complets:');
  console.log(JSON.stringify(getResult, null, 2));

  // Fermer la connexion
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Demo terminée avec succès!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Attendre un peu avant de fermer
  await new Promise(resolve => setTimeout(resolve, 1000));
  process.exit(0);
}

// Exécuter la demo
demo().catch((error) => {
  console.error('\n❌ Erreur:', error.message);
  console.error('\nAssurez-vous que:');
  console.error('  1. Le serveur MCP est démarré (npm run mcp:start)');
  console.error('  2. PostgreSQL est en cours d\'exécution');
  console.error('  3. La base de données est configurée dans .env\n');
  process.exit(1);
});
