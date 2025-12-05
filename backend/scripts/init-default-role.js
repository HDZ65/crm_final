/**
 * Script pour créer un rôle "owner" par défaut pour les créateurs de comptes
 * Usage: node scripts/init-default-role.js
 */

const { Client } = require('pg');

async function initDefaultRole() {
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

    // Vérifier si un rôle "owner" existe déjà
    const checkQuery = `SELECT id, nom FROM roles WHERE nom = 'owner' LIMIT 1`;
    const checkResult = await client.query(checkQuery);

    if (checkResult.rows.length > 0) {
      console.log('✅ Rôle "owner" existe déjà :');
      console.log(checkResult.rows[0]);
      console.log('\n💡 ID du rôle à utiliser:', checkResult.rows[0].id);
      await client.end();
      return checkResult.rows[0].id;
    }

    // Créer le rôle "owner"
    console.log('📝 Création du rôle "owner"...');
    const insertQuery = `
      INSERT INTO roles (code, nom, description, "createdAt", "updatedAt")
      VALUES ('owner', 'owner', 'Propriétaire de l''organisation', NOW(), NOW())
      RETURNING id, code, nom
    `;
    const insertResult = await client.query(insertQuery);

    console.log('✅ Rôle "owner" créé :');
    console.log(insertResult.rows[0]);
    console.log('\n💡 ID du rôle à utiliser:', insertResult.rows[0].id);
    console.log('\n📝 Ajoutez cette valeur dans votre .env :');
    console.log(`DEFAULT_OWNER_ROLE_ID=${insertResult.rows[0].id}`);

    await client.end();
    return insertResult.rows[0].id;
  } catch (error) {
    console.error('\n❌ Erreur :', error.message);
    await client.end();
    process.exit(1);
  }
}

initDefaultRole();
