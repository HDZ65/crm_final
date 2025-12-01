/**
 * Script tout-en-un : Crée un utilisateur ET un compte, puis les associe
 * Usage: node scripts/setup-user-with-compte.js
 */

const { Client } = require('pg');

async function setupUserWithCompte() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // ================================
    // CONFIGURATION - MODIFIEZ ICI
    // ================================
    const userData = {
      keycloakId: 'VOTRE_KEYCLOAK_ID', // ← Récupéré depuis Keycloak Admin Console
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      telephone: '+33612345678',
      actif: true,
    };

    const compteName = 'Mon Organisation';
    // ================================

    // 1. Créer ou récupérer l'utilisateur
    console.log('🔍 Recherche de l\'utilisateur...');
    let userId;
    const checkUserQuery = `SELECT id, email FROM utilisateurs WHERE "keycloakId" = $1 OR email = $2`;
    const checkUserResult = await client.query(checkUserQuery, [userData.keycloakId, userData.email]);

    if (checkUserResult.rows.length > 0) {
      userId = checkUserResult.rows[0].id;
      console.log('✅ Utilisateur existant trouvé:', checkUserResult.rows[0]);
    } else {
      console.log('📝 Création de l\'utilisateur...');
      const insertUserQuery = `
        INSERT INTO utilisateurs ("keycloakId", nom, prenom, email, telephone, actif, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, nom, prenom
      `;
      const insertUserResult = await client.query(insertUserQuery, [
        userData.keycloakId,
        userData.nom,
        userData.prenom,
        userData.email,
        userData.telephone,
        userData.actif,
      ]);
      userId = insertUserResult.rows[0].id;
      console.log('✅ Utilisateur créé:', insertUserResult.rows[0]);
    }

    // 2. Créer le Compte
    console.log('\n📝 Création du Compte...');
    const insertCompteQuery = `
      INSERT INTO comptes (nom, "createdAt", "updatedAt")
      VALUES ($1, NOW(), NOW())
      RETURNING id, nom
    `;
    const compteResult = await client.query(insertCompteQuery, [compteName]);
    const compteId = compteResult.rows[0].id;
    console.log('✅ Compte créé:', compteResult.rows[0]);

    // 3. Associer l'utilisateur au compte
    console.log('\n🔗 Association utilisateur ↔ compte...');
    const insertMembreQuery = `
      INSERT INTO membres_comptes ("utilisateurId", "compteId", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id
    `;
    await client.query(insertMembreQuery, [userId, compteId]);
    console.log('✅ Association créée');

    // 4. Vérification finale
    console.log('\n📊 Vérification finale...');
    const verifyQuery = `
      SELECT
        u.id as utilisateur_id,
        u."keycloakId" as keycloak_id,
        u.email,
        u.nom || ' ' || u.prenom as nom_complet,
        c.id as compte_id,
        c.nom as compte_nom
      FROM utilisateurs u
      INNER JOIN membres_comptes mc ON mc."utilisateurId" = u.id
      INNER JOIN comptes c ON c.id = mc."compteId"
      WHERE u.id = $1 AND c.id = $2
    `;
    const verifyResult = await client.query(verifyQuery, [userId, compteId]);

    console.log('\n✅ Configuration terminée avec succès !\n');
    console.table(verifyResult.rows);

    console.log('\n💡 Prochaines étapes :');
    console.log('  1. L\'utilisateur peut maintenant se connecter via Keycloak');
    console.log('  2. Lors de la première connexion, le backend le synchronisera automatiquement');
    console.log('  3. Vous pouvez créer des Groupes dans ce Compte');
    console.log('  4. Associer des clients à ce Compte via leur compteId');

    await client.end();
  } catch (error) {
    console.error('\n❌ Erreur :', error.message);
    console.error('Stack:', error.stack);
    await client.end();
    process.exit(1);
  }
}

setupUserWithCompte();
