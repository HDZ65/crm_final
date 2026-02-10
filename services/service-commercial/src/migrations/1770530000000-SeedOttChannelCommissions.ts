import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedOttChannelCommissions1770530000000 implements MigrationInterface {
  name = 'SeedOttChannelCommissions1770530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get a default organisation_id from baremes_commission if data exists,
    // otherwise use a placeholder UUID (organisations table lives in service-core DB)
    const orgResult = await queryRunner.query(`
      SELECT DISTINCT organisation_id AS id FROM baremes_commission LIMIT 1
    `);
    const organisationId = orgResult[0]?.id || '00000000-0000-0000-0000-000000000001';

    // Seed OTT channel commission rates for PREMIUM_SVOD
    await queryRunner.query(`
      INSERT INTO baremes_commission (
        organisation_id,
        code,
        nom,
        description,
        type_calcul,
        base_calcul,
        taux_pourcentage,
        type_produit,
        canal_vente,
        date_effet,
        actif
      ) VALUES
      (
        '${organisationId}',
        'OTT_PREMIUM_WEB_DIRECT',
        'Commission Premium SVOD - Web Direct',
        'Commission pour abonnements Premium SVOD vendus en direct via web (CB)',
        'pourcentage',
        'ca_ht',
        15.00,
        'PREMIUM_SVOD',
        'web_direct',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_PREMIUM_APPLE',
        'Commission Premium SVOD - Apple Store',
        'Commission pour abonnements Premium SVOD vendus via Apple App Store (taux réduit car Apple prend 30%)',
        'pourcentage',
        'ca_ht',
        10.00,
        'PREMIUM_SVOD',
        'apple_store',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_PREMIUM_GOOGLE',
        'Commission Premium SVOD - Google Play',
        'Commission pour abonnements Premium SVOD vendus via Google Play Store (taux réduit car Google prend 30%)',
        'pourcentage',
        'ca_ht',
        10.00,
        'PREMIUM_SVOD',
        'google_store',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_PREMIUM_TV',
        'Commission Premium SVOD - TV Store',
        'Commission pour abonnements Premium SVOD vendus via TV stores (Samsung, LG, etc.)',
        'pourcentage',
        'ca_ht',
        12.00,
        'PREMIUM_SVOD',
        'tv_store',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_PREMIUM_OPERATOR',
        'Commission Premium SVOD - Opérateur',
        'Commission pour abonnements Premium SVOD vendus via opérateurs télécom',
        'pourcentage',
        'ca_ht',
        8.00,
        'PREMIUM_SVOD',
        'operator',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_PREMIUM_AFFILIATE',
        'Commission Premium SVOD - Affilié',
        'Commission pour abonnements Premium SVOD vendus via affiliés/partenaires',
        'pourcentage',
        'ca_ht',
        20.00,
        'PREMIUM_SVOD',
        'affiliate',
        '2026-01-01',
        true
      )
      ON CONFLICT (code) DO NOTHING
    `);

    // Seed OTT channel commission rates for VIP
    await queryRunner.query(`
      INSERT INTO baremes_commission (
        organisation_id,
        code,
        nom,
        description,
        type_calcul,
        base_calcul,
        taux_pourcentage,
        type_produit,
        canal_vente,
        date_effet,
        actif
      ) VALUES
      (
        '${organisationId}',
        'OTT_VIP_WEB_DIRECT',
        'Commission VIP - Web Direct',
        'Commission pour abonnements VIP vendus en direct via web (CB)',
        'pourcentage',
        'ca_ht',
        20.00,
        'VIP',
        'web_direct',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_VIP_APPLE',
        'Commission VIP - Apple Store',
        'Commission pour abonnements VIP vendus via Apple App Store (taux réduit car Apple prend 30%)',
        'pourcentage',
        'ca_ht',
        12.00,
        'VIP',
        'apple_store',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_VIP_GOOGLE',
        'Commission VIP - Google Play',
        'Commission pour abonnements VIP vendus via Google Play Store (taux réduit car Google prend 30%)',
        'pourcentage',
        'ca_ht',
        12.00,
        'VIP',
        'google_store',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_VIP_TV',
        'Commission VIP - TV Store',
        'Commission pour abonnements VIP vendus via TV stores (Samsung, LG, etc.)',
        'pourcentage',
        'ca_ht',
        15.00,
        'VIP',
        'tv_store',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_VIP_OPERATOR',
        'Commission VIP - Opérateur',
        'Commission pour abonnements VIP vendus via opérateurs télécom',
        'pourcentage',
        'ca_ht',
        10.00,
        'VIP',
        'operator',
        '2026-01-01',
        true
      ),
      (
        '${organisationId}',
        'OTT_VIP_AFFILIATE',
        'Commission VIP - Affilié',
        'Commission pour abonnements VIP vendus via affiliés/partenaires',
        'pourcentage',
        'ca_ht',
        25.00,
        'VIP',
        'affiliate',
        '2026-01-01',
        true
      )
      ON CONFLICT (code) DO NOTHING
    `);

    // Note: FREE_AVOD plans are intentionally excluded from commission rates
    // as they generate no revenue and should not trigger commissions
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all OTT channel commission rates
    await queryRunner.query(`
      DELETE FROM baremes_commission
      WHERE code IN (
        'OTT_PREMIUM_WEB_DIRECT',
        'OTT_PREMIUM_APPLE',
        'OTT_PREMIUM_GOOGLE',
        'OTT_PREMIUM_TV',
        'OTT_PREMIUM_OPERATOR',
        'OTT_PREMIUM_AFFILIATE',
        'OTT_VIP_WEB_DIRECT',
        'OTT_VIP_APPLE',
        'OTT_VIP_GOOGLE',
        'OTT_VIP_TV',
        'OTT_VIP_OPERATOR',
        'OTT_VIP_AFFILIATE'
      )
    `);
  }
}
