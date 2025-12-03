-- Mise à jour des dates de signature des contrats pour les tests
-- Date du jour: 2025-12-03

-- Contrats signés dans les dernières 24h (2-3 décembre 2025)
UPDATE contrats SET "dateSignature" = '2025-12-03', "dateDebut" = '2025-12-03', "dateFin" = '2026-12-03' 
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE contrats SET "dateSignature" = '2025-12-02', "dateDebut" = '2025-12-02', "dateFin" = '2026-12-02' 
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE contrats SET "dateSignature" = '2025-12-03', "dateDebut" = '2025-12-03', "dateFin" = '2026-12-03' 
WHERE id = '00000000-0000-0000-0000-000000000003';

-- Contrats signés dans les 7 derniers jours (26 nov - 1 déc 2025)
UPDATE contrats SET "dateSignature" = '2025-11-28', "dateDebut" = '2025-12-01', "dateFin" = '2026-12-01' 
WHERE id = '00000000-0000-0000-0000-000000000004';

UPDATE contrats SET "dateSignature" = '2025-11-30', "dateDebut" = '2025-12-01', "dateFin" = '2026-12-01' 
WHERE id = '00000000-0000-0000-0000-000000000005';

UPDATE contrats SET "dateSignature" = '2025-11-27', "dateDebut" = '2025-12-01', "dateFin" = '2026-12-01' 
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Contrats signés dans les 30 derniers jours (3 nov - 25 nov 2025)
UPDATE contrats SET "dateSignature" = '2025-11-15', "dateDebut" = '2025-12-01', "dateFin" = '2026-12-01' 
WHERE id = '00000000-0000-0000-0000-000000000007';

UPDATE contrats SET "dateSignature" = '2025-11-10', "dateDebut" = '2025-12-01', "dateFin" = '2026-12-01' 
WHERE id = '00000000-0000-0000-0000-000000000008';

UPDATE contrats SET "dateSignature" = '2025-11-20', "dateDebut" = '2025-12-01', "dateFin" = '2026-12-01' 
WHERE id = '00000000-0000-0000-0000-000000000009';

UPDATE contrats SET "dateSignature" = '2025-11-05', "dateDebut" = '2025-12-01', "dateFin" = '2026-12-31' 
WHERE id = '00000000-0000-0000-0000-00000000000a';

SELECT 'Dates mises à jour avec succès!' as message;
