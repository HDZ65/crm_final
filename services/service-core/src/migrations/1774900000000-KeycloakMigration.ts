import { MigrationInterface, QueryRunner } from 'typeorm';

export class KeycloakMigration1774900000000 implements MigrationInterface {
  name = 'KeycloakMigration1774900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // Step 1: Create acces_societes table (member → société access control)
    // owner/admin have access to all sociétés, members need explicit entries
    // =========================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS acces_societes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keycloak_user_id VARCHAR(255) NOT NULL,
        societe_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_acces_societes_user_societe UNIQUE (keycloak_user_id, societe_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_acces_societes_user ON acces_societes(keycloak_user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_acces_societes_societe ON acces_societes(societe_id)`);

    // =========================================================================
    // Step 2: Migrate organisation_id → keycloak_group_id in business tables
    // For each table: add keycloak_group_id column, copy data from organisations
    // lookup, then drop the old FK column
    // =========================================================================

    const tablesToMigrate = [
      { table: 'societes', nullable: false },
      { table: 'clientbases', nullable: false },
      { table: 'piecejointes', nullable: true },
      { table: 'document_audit_logs', nullable: false },
      { table: 'transporteurorganisations', nullable: false },
      { table: 'abonnement_depanssur', nullable: false },
      { table: 'dossiers_declaratifs', nullable: false },
      { table: 'invitationorganisations', nullable: false },
    ];

    for (const { table, nullable } of tablesToMigrate) {
      const hasOrgIdCol = await queryRunner.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = 'organisation_id'`,
      );
      if (hasOrgIdCol.length === 0) continue;

      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS keycloak_group_id VARCHAR(255)`);

      await queryRunner.query(`
        UPDATE "${table}" t
        SET keycloak_group_id = o.keycloak_group_id
        FROM organisations o
        WHERE t.organisation_id = o.id
          AND o.keycloak_group_id IS NOT NULL
          AND t.keycloak_group_id IS NULL
      `);

      if (!nullable) {
        await queryRunner.query(`
          UPDATE "${table}" SET keycloak_group_id = organisation_id::text
          WHERE keycloak_group_id IS NULL
        `);
      }

      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_${table}_keycloak_group_id ON "${table}"(keycloak_group_id)`,
      );

      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS organisation_id`);
    }

    // =========================================================================
    // Step 3: Add FK from acces_societes to societes
    // =========================================================================
    await queryRunner.query(`
      ALTER TABLE acces_societes
      ADD CONSTRAINT fk_acces_societes_societe
      FOREIGN KEY (societe_id) REFERENCES societes(id) ON DELETE CASCADE
    `);

    // =========================================================================
    // Step 4: Drop obsolete identity tables (order matters for FK deps)
    // =========================================================================
    await queryRunner.query(`DROP TABLE IF EXISTS membreorganisations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS invitationorganisations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS rolepermissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS comptes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS utilisateurs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS organisations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_tokens CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate organisations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organisations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom VARCHAR(255) NOT NULL,
        description TEXT,
        siret VARCHAR(20),
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(255),
        keycloak_group_id VARCHAR(255),
        actif BOOLEAN DEFAULT true,
        etat VARCHAR(50) DEFAULT 'actif',
        created_by VARCHAR(255),
        modified_by VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Recreate utilisateurs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS utilisateurs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keycloak_id VARCHAR(255) UNIQUE,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telephone VARCHAR(50),
        actif BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Recreate roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Recreate comptes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS comptes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nom VARCHAR(255) NOT NULL,
        etat VARCHAR(50) DEFAULT 'actif',
        date_creation TIMESTAMPTZ DEFAULT NOW(),
        created_by_user_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Recreate membreorganisations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS membreorganisations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organisation_id UUID NOT NULL,
        utilisateur_id UUID NOT NULL,
        role_id UUID NOT NULL,
        etat VARCHAR(50) DEFAULT 'actif',
        date_invitation TIMESTAMPTZ,
        date_activation TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(organisation_id, utilisateur_id)
      )
    `);

    // Recreate permissions & rolepermissions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS rolepermissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL,
        permission_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Recreate password_reset_tokens
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        keycloak_user_id VARCHAR(255) NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Re-add organisation_id to business tables
    const tablesToRevert = [
      'societes',
      'clientbases',
      'piecejointes',
      'document_audit_logs',
      'transporteurorganisations',
      'abonnement_depanssur',
      'dossiers_declaratifs',
      'invitationorganisations',
    ];

    for (const table of tablesToRevert) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS organisation_id UUID`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS keycloak_group_id`);
    }

    // Drop acces_societes
    await queryRunner.query(`DROP TABLE IF EXISTS acces_societes`);
  }
}
