/**
 * Script pour créer un Compte et y associer un utilisateur
 * Usage: node scripts/create-compte-and-associate.js
 */

const { Client } = require('pg');

async function createCompteAndAssociate() {
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

    // CONFIGURATION
    const userEmail = 'john.doe@example.com'; // Email de l'utilisateur à associer
    const compteName = 'Mon Organisation'; // Nom du compte à créer

    // 1. Récupérer l'utilisateur
    const userQuery = `SELECT id, email FROM utilisateurs WHERE email = $1`;
    const userResult = await client.query(userQuery, [userEmail]);

    if (userResult.rows.length === 0) {
      console.error('❌ Utilisateur non trouvé avec email:', userEmail);
      console.log('💡 Créez d\'abord l\'utilisateur avec create-user-manually.js');
      await client.end();
      return;
    }

    const userId = userResult.rows[0].id;
    console.log('✅ Utilisateur trouvé:', userResult.rows[0]);

    // 2. Créer le Compte
    const compteQuery = `
      INSERT INTO comptes (nom, "createdAt", "updatedAt")
      VALUES ($1, NOW(), NOW())
      RETURNING id, nom
    `;
    const compteResult = await client.query(compteQuery, [compteName]);
    const compteId = compteResult.rows[0].id;
    console.log('✅ Compte créé:', compteResult.rows[0]);

    // 3. Associer l'utilisateur au compte via MembreCompte
    const membreQuery = `
      INSERT INTO membres_comptes ("utilisateurId", "compteId", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id, "utilisateurId", "compteId"
    `;
    const membreResult = await client.query(membreQuery, [userId, compteId]);
    console.log('✅ Utilisateur associé au compte:', membreResult.rows[0]);

    // 4. Vérification finale
    const verifyQuery = `
      SELECT
        u.id as user_id,
        u.email,
        u.nom,
        u.prenom,
        c.id as compte_id,
        c.nom as compte_nom,
        mc.id as membre_id
      FROM utilisateurs u
      INNER JOIN membres_comptes mc ON mc."utilisateurId" = u.id
      INNER JOIN comptes c ON c.id = mc."compteId"
      WHERE u.id = $1 AND c.id = $2
    `;
    const verifyResult = await client.query(verifyQuery, [userId, compteId]);

    console.log('\n📊 Résumé final :');
    console.table(verifyResult.rows);

    await client.end();
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    await client.end();
    process.exit(1);
  }
}

createCompteAndAssociate();
