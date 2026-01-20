/**
 * Script pour créer manuellement un utilisateur dans PostgreSQL
 * Usage: node scripts/create-user-manually.js
 */

const { Client } = require('pg');

async function createUser() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // REMPLACEZ CES VALEURS PAR LES VÔTRES
    const userData = {
      keycloakId: 'VOTRE_KEYCLOAK_ID', // Récupéré depuis Keycloak Admin Console
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      telephone: '+33612345678',
      actif: true,
    };

    // Vérifier si l'utilisateur existe déjà
    const checkQuery = `
      SELECT id, "keycloakId", email
      FROM utilisateurs
      WHERE "keycloakId" = $1 OR email = $2
    `;
    const checkResult = await client.query(checkQuery, [userData.keycloakId, userData.email]);

    if (checkResult.rows.length > 0) {
      console.log('⚠️  Utilisateur déjà existant :');
      console.log(checkResult.rows[0]);
      await client.end();
      return;
    }

    // Créer l'utilisateur
    const insertQuery = `
      INSERT INTO utilisateurs ("keycloakId", nom, prenom, email, telephone, actif, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, "keycloakId", email, nom, prenom
    `;

    const result = await client.query(insertQuery, [
      userData.keycloakId,
      userData.nom,
      userData.prenom,
      userData.email,
      userData.telephone,
      userData.actif,
    ]);

    console.log('✅ Utilisateur créé avec succès :');
    console.log(result.rows[0]);

    await client.end();
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    await client.end();
    process.exit(1);
  }
}

createUser();
