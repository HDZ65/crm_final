import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedStatutContrat1774200000000 implements MigrationInterface {
  name = 'SeedStatutContrat1774200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed contract status lifecycle states
    await queryRunner.query(`
      INSERT INTO statut_contrat (
        id,
        code,
        nom,
        description,
        ordre_affichage
      ) VALUES
      (
        gen_random_uuid(),
        'DRAFT',
        'Brouillon',
        'Contrat en cours de saisie ou en attente de validation CQ',
        1
      ),
      (
        gen_random_uuid(),
        'ACTIVE',
        'Actif',
        'Délai de rétractation passé, mandat validé, services fonctionnels',
        2
      ),
      (
        gen_random_uuid(),
        'SUSPENDED',
        'Suspendu',
        'Incident de paiement ou demande spécifique, services coupés',
        3
      ),
      (
        gen_random_uuid(),
        'TERMINATED',
        'Résilié',
        'Fin définitive du contrat, ressources libérées',
        4
      ),
      (
        gen_random_uuid(),
        'CLOSED',
        'Terminé',
        'Échéance naturelle atteinte sans reconduction tacite',
        5
      )
      ON CONFLICT (code) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Seeds are not reversible - do nothing on down
  }
}
