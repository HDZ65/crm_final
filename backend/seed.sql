-- ============================================
-- Script de seed pour les clients et contrats
-- ============================================

-- Note: Ce script utilise des UUIDs fixes pour faciliter les références
-- Exécuter avec: psql -U postgres -d postgres -f seed.sql
-- Ou via un client SQL comme DBeaver/pgAdmin

-- ============================================
-- 1. Données de référence
-- ============================================

-- Statuts Client
INSERT INTO "statutclients" (id, code, nom, description, "ordreAffichage", "createdAt", "updatedAt")
VALUES
  ('11111111-1111-1111-1111-111111111001', 'PROSPECT', 'Prospect', 'Client potentiel', 1, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111002', 'ACTIF', 'Actif', 'Client actif', 2, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111003', 'INACTIF', 'Inactif', 'Client inactif', 3, NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111004', 'RESILIE', 'Résilié', 'Client résilié', 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Statuts Contrat
INSERT INTO "statutcontrats" (id, code, nom, description, "ordreAffichage", "createdAt", "updatedAt")
VALUES
  ('22222222-2222-2222-2222-222222222001', 'BROUILLON', 'Brouillon', 'Contrat en cours de rédaction', 1, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222002', 'EN_ATTENTE', 'En attente', 'Contrat en attente de validation', 2, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222003', 'ACTIF', 'Actif', 'Contrat actif', 3, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222004', 'SUSPENDU', 'Suspendu', 'Contrat suspendu', 4, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222005', 'RESILIE', 'Résilié', 'Contrat résilié', 5, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222006', 'EXPIRE', 'Expiré', 'Contrat expiré', 6, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Conditions de paiement
INSERT INTO "conditionpaiements" (id, code, nom, description, "delaiJours", "createdAt", "updatedAt")
VALUES
  ('33333333-3333-3333-3333-333333333001', 'COMPTANT', 'Comptant', 'Paiement à la commande', 0, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333002', 'NET30', 'Net 30 jours', 'Paiement sous 30 jours', 30, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333003', 'NET60', 'Net 60 jours', 'Paiement sous 60 jours', 60, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333004', 'FIN_MOIS', 'Fin de mois', 'Paiement en fin de mois', 30, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Modèles de distribution
INSERT INTO "modeledistributions" (id, code, nom, description, "createdAt", "updatedAt")
VALUES
  ('44444444-4444-4444-4444-444444444001', 'DIRECT', 'Direct', 'Vente directe', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444002', 'INDIRECT', 'Indirect', 'Vente via partenaires', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444003', 'MIXTE', 'Mixte', 'Combinaison direct et indirect', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Facturation par
INSERT INTO "facturationpars" (id, code, nom, description, "createdAt", "updatedAt")
VALUES
  ('55555555-5555-5555-5555-555555555001', 'MENSUEL', 'Mensuel', 'Facturation mensuelle', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555002', 'TRIMESTRIEL', 'Trimestriel', 'Facturation trimestrielle', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555003', 'ANNUEL', 'Annuel', 'Facturation annuelle', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555004', 'PONCTUEL', 'Ponctuel', 'Facturation ponctuelle', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Organisation
-- ============================================
-- Note: Utiliser l'organisation existante "Finanssor" (9bfa9d59-45a0-42d8-a802-775663358337)
-- Si vous n'avez pas cette organisation, créez-en une via l'application et remplacez l'ID ci-dessous

-- Variable pour l'organisation ID (remplacer par votre ID si différent)
-- Organisation ID: 9bfa9d59-45a0-42d8-a802-775663358337

-- ============================================
-- 3. Utilisateur (Commercial)
-- ============================================

INSERT INTO "utilisateurs" (id, "keycloakId", nom, prenom, email, telephone, actif, "createdAt", "updatedAt")
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'keycloak-001', 'Dupont', 'Jean', 'jean.dupont@finanssor.fr', '06 12 34 56 78', true, NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'keycloak-002', 'Martin', 'Sophie', 'sophie.martin@finanssor.fr', '06 23 45 67 89', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. Sociétés (Compagnies d'assurance / Fournisseurs)
-- ============================================

INSERT INTO "societes" (id, "organisationId", "raisonSociale", siren, "numeroTVA", "createdAt", "updatedAt")
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '9bfa9d59-45a0-42d8-a802-775663358337', 'AXA France', '310499959', 'FR12310499959', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '9bfa9d59-45a0-42d8-a802-775663358337', 'Allianz France', '542110291', 'FR45542110291', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '9bfa9d59-45a0-42d8-a802-775663358337', 'Groupama', '343115135', 'FR89343115135', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccc04', '9bfa9d59-45a0-42d8-a802-775663358337', 'MAIF', '775709702', 'FR56775709702', NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccc05', '9bfa9d59-45a0-42d8-a802-775663358337', 'Generali France', '552062663', 'FR78552062663', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. Clients (ClientBase)
-- ============================================

INSERT INTO "clientbases" (id, "organisationId", "typeClient", nom, prenom, "dateNaissance", "compteCode", "partenaireId", "dateCreation", telephone, email, "statutId", "createdAt", "updatedAt")
VALUES
  -- Clients particuliers
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '9bfa9d59-45a0-42d8-a802-775663358337', 'particulier', 'Bernard', 'Michel', '1975-03-15', 'CLI-001', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '06 11 22 33 44', 'michel.bernard@email.com', '11111111-1111-1111-1111-111111111002', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '9bfa9d59-45a0-42d8-a802-775663358337', 'particulier', 'Leroy', 'Marie', '1982-07-22', 'CLI-002', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '06 22 33 44 55', 'marie.leroy@email.com', '11111111-1111-1111-1111-111111111002', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', '9bfa9d59-45a0-42d8-a802-775663358337', 'particulier', 'Moreau', 'Pierre', '1968-11-08', 'CLI-003', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '06 33 44 55 66', 'pierre.moreau@email.com', '11111111-1111-1111-1111-111111111002', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd04', '9bfa9d59-45a0-42d8-a802-775663358337', 'particulier', 'Simon', 'Isabelle', '1990-02-28', 'CLI-004', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '06 44 55 66 77', 'isabelle.simon@email.com', '11111111-1111-1111-1111-111111111001', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd05', '9bfa9d59-45a0-42d8-a802-775663358337', 'particulier', 'Laurent', 'François', '1955-09-12', 'CLI-005', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '06 55 66 77 88', 'francois.laurent@email.com', '11111111-1111-1111-1111-111111111002', NOW(), NOW()),
  -- Clients entreprises
  ('dddddddd-dddd-dddd-dddd-dddddddddd06', '9bfa9d59-45a0-42d8-a802-775663358337', 'entreprise', 'SARL Tech Solutions', '', NULL, 'CLI-006', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '01 45 67 89 00', 'contact@techsolutions.fr', '11111111-1111-1111-1111-111111111002', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd07', '9bfa9d59-45a0-42d8-a802-775663358337', 'entreprise', 'SAS Boulangerie Martin', '', NULL, 'CLI-007', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '01 56 78 90 11', 'contact@boulangeriemartin.fr', '11111111-1111-1111-1111-111111111002', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd08', '9bfa9d59-45a0-42d8-a802-775663358337', 'entreprise', 'Restaurant Le Gourmet', '', NULL, 'CLI-008', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '01 67 89 01 22', 'contact@legourmet.fr', '11111111-1111-1111-1111-111111111003', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd09', '9bfa9d59-45a0-42d8-a802-775663358337', 'entreprise', 'Cabinet Avocat Durand', '', NULL, 'CLI-009', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '01 78 90 12 33', 'contact@avocat-durand.fr', '11111111-1111-1111-1111-111111111002', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddd10', '9bfa9d59-45a0-42d8-a802-775663358337', 'entreprise', 'Garage Auto Plus', '', NULL, 'CLI-010', '9bfa9d59-45a0-42d8-a802-775663358337', NOW(), '01 89 01 23 44', 'contact@autoplus.fr', '11111111-1111-1111-1111-111111111001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. Adresses (pour facturation)
-- ============================================

INSERT INTO "adresses" (id, "clientBaseId", ligne1, ligne2, "codePostal", ville, pays, type, "createdAt", "updatedAt")
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'dddddddd-dddd-dddd-dddd-dddddddddd01', '12 Rue des Lilas', 'Apt 3B', '75011', 'Paris', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 'dddddddd-dddd-dddd-dddd-dddddddddd02', '45 Avenue Victor Hugo', NULL, '69003', 'Lyon', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'dddddddd-dddd-dddd-dddd-dddddddddd03', '8 Place de la République', NULL, '33000', 'Bordeaux', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', 'dddddddd-dddd-dddd-dddd-dddddddddd04', '23 Rue du Commerce', 'Bâtiment A', '44000', 'Nantes', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', 'dddddddd-dddd-dddd-dddd-dddddddddd05', '67 Boulevard Gambetta', NULL, '59000', 'Lille', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee06', 'dddddddd-dddd-dddd-dddd-dddddddddd06', '100 Rue de l''Innovation', 'Zone Industrielle', '31000', 'Toulouse', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', 'dddddddd-dddd-dddd-dddd-dddddddddd07', '5 Rue du Four', NULL, '13001', 'Marseille', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee08', 'dddddddd-dddd-dddd-dddd-dddddddddd08', '18 Rue Gastronomie', NULL, '67000', 'Strasbourg', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee09', 'dddddddd-dddd-dddd-dddd-dddddddddd09', '3 Place du Tribunal', '2ème étage', '35000', 'Rennes', 'France', 'facturation', NOW(), NOW()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10', 'dddddddd-dddd-dddd-dddd-dddddddddd10', '88 Route Nationale', NULL, '76000', 'Rouen', 'France', 'facturation', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. Rôles Partenaire (pour client-partenaire)
-- ============================================

INSERT INTO "rolepartenaires" (id, code, nom, description, "createdAt", "updatedAt")
VALUES
  ('66666666-6666-6666-6666-666666666001', 'CLIENT', 'Client', 'Client standard', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666002', 'VIP', 'VIP', 'Client privilégié', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. Client-Partenaire (liaison)
-- ============================================

INSERT INTO "clientpartenaires" (id, "clientBaseId", "partenaireId", "rolePartenaireId", "validFrom", "validTo", "createdAt", "updatedAt")
VALUES
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'dddddddd-dddd-dddd-dddd-dddddddddd01', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666001', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', 'dddddddd-dddd-dddd-dddd-dddddddddd02', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666002', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', 'dddddddd-dddd-dddd-dddd-dddddddddd03', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666001', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff4', 'dddddddd-dddd-dddd-dddd-dddddddddd04', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666001', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff5', 'dddddddd-dddd-dddd-dddd-dddddddddd05', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666002', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff6', 'dddddddd-dddd-dddd-dddd-dddddddddd06', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666001', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff7', 'dddddddd-dddd-dddd-dddd-dddddddddd07', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666001', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff8', 'dddddddd-dddd-dddd-dddd-dddddddddd08', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666001', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-fffffffffff9', 'dddddddd-dddd-dddd-dddd-dddddddddd09', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666002', '2024-01-01', '2099-12-31', NOW(), NOW()),
  ('ffffffff-ffff-ffff-ffff-ffffffffffa0', 'dddddddd-dddd-dddd-dddd-dddddddddd10', '9bfa9d59-45a0-42d8-a802-775663358337', '66666666-6666-6666-6666-666666666001', '2024-01-01', '2099-12-31', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 9. Contrats
-- ============================================

INSERT INTO "contrats" (id, "organisationId", "referenceExterne", "dateSignature", "dateDebut", "dateFin", "statutId", "autoRenouvellement", "joursPreavis", "conditionPaiementId", "modeleDistributionId", "facturationParId", "clientBaseId", "societeId", "commercialId", "clientPartenaireId", "adresseFacturationId", "dateFinRetractation", "createdAt", "updatedAt")
VALUES
  -- Contrats Assurance Santé (AXA)
  ('00000000-0000-0000-0000-000000000001', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-001', '2024-01-15', '2024-02-01', '2025-01-31', '22222222-2222-2222-2222-222222222003', true, 60, '33333333-3333-3333-3333-333333333002', '44444444-4444-4444-4444-444444444001', '55555555-5555-5555-5555-555555555001', 'dddddddd-dddd-dddd-dddd-dddddddddd01', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', '2024-01-29', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000002', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-002', '2024-02-20', '2024-03-01', '2025-02-28', '22222222-2222-2222-2222-222222222003', true, 60, '33333333-3333-3333-3333-333333333002', '44444444-4444-4444-4444-444444444001', '55555555-5555-5555-5555-555555555001', 'dddddddd-dddd-dddd-dddd-dddddddddd02', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', '2024-03-06', NOW(), NOW()),

  -- Contrats Prévoyance (Allianz)
  ('00000000-0000-0000-0000-000000000003', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-003', '2024-03-10', '2024-04-01', '2025-03-31', '22222222-2222-2222-2222-222222222003', true, 90, '33333333-3333-3333-3333-333333333003', '44444444-4444-4444-4444-444444444001', '55555555-5555-5555-5555-555555555002', 'dddddddd-dddd-dddd-dddd-dddddddddd03', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'ffffffff-ffff-ffff-ffff-fffffffffff3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', '2024-03-24', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000004', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-004', '2024-04-05', '2024-05-01', '2025-04-30', '22222222-2222-2222-2222-222222222003', false, 30, '33333333-3333-3333-3333-333333333002', '44444444-4444-4444-4444-444444444001', '55555555-5555-5555-5555-555555555001', 'dddddddd-dddd-dddd-dddd-dddddddddd05', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'ffffffff-ffff-ffff-ffff-fffffffffff5', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', '2024-04-19', NOW(), NOW()),

  -- Contrats Entreprise - Assurance Pro (Groupama)
  ('00000000-0000-0000-0000-000000000005', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-005', '2024-05-15', '2024-06-01', '2025-05-31', '22222222-2222-2222-2222-222222222003', true, 90, '33333333-3333-3333-3333-333333333003', '44444444-4444-4444-4444-444444444002', '55555555-5555-5555-5555-555555555003', 'dddddddd-dddd-dddd-dddd-dddddddddd06', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-fffffffffff6', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee06', '2024-05-29', NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000006', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-006', '2024-06-20', '2024-07-01', '2025-06-30', '22222222-2222-2222-2222-222222222003', true, 60, '33333333-3333-3333-3333-333333333002', '44444444-4444-4444-4444-444444444002', '55555555-5555-5555-5555-555555555001', 'dddddddd-dddd-dddd-dddd-dddddddddd07', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-fffffffffff7', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', '2024-07-04', NOW(), NOW()),

  -- Contrats Auto/Habitation (MAIF)
  ('00000000-0000-0000-0000-000000000007', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-007', '2024-07-10', '2024-08-01', '2025-07-31', '22222222-2222-2222-2222-222222222004', true, 30, '33333333-3333-3333-3333-333333333001', '44444444-4444-4444-4444-444444444001', '55555555-5555-5555-5555-555555555001', 'dddddddd-dddd-dddd-dddd-dddddddddd08', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'ffffffff-ffff-ffff-ffff-fffffffffff8', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee08', '2024-07-24', NOW(), NOW()),

  -- Contrats Pro - RC Pro (Generali)
  ('00000000-0000-0000-0000-000000000008', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-008', '2024-08-05', '2024-09-01', '2025-08-31', '22222222-2222-2222-2222-222222222003', true, 90, '33333333-3333-3333-3333-333333333003', '44444444-4444-4444-4444-444444444001', '55555555-5555-5555-5555-555555555003', 'dddddddd-dddd-dddd-dddd-dddddddddd09', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-fffffffffff9', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee09', '2024-08-19', NOW(), NOW()),

  -- Contrats en attente / brouillon
  ('00000000-0000-0000-0000-000000000009', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-009', '2024-11-15', '2024-12-01', '2025-11-30', '22222222-2222-2222-2222-222222222002', true, 60, '33333333-3333-3333-3333-333333333002', '44444444-4444-4444-4444-444444444001', '55555555-5555-5555-5555-555555555001', 'dddddddd-dddd-dddd-dddd-dddddddddd04', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'ffffffff-ffff-ffff-ffff-fffffffffff4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', '2024-11-29', NOW(), NOW()),

  ('00000000-0000-0000-0000-00000000000a', '9bfa9d59-45a0-42d8-a802-775663358337', 'CTR-2024-010', '2024-11-20', '2025-01-01', '2025-12-31', '22222222-2222-2222-2222-222222222001', false, 30, '33333333-3333-3333-3333-333333333001', '44444444-4444-4444-4444-444444444003', '55555555-5555-5555-5555-555555555004', 'dddddddd-dddd-dddd-dddd-dddddddddd10', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ffffffff-ffff-ffff-ffff-ffffffffffa0', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee10', '2024-12-04', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 10. Gammes (Catégories de produits)
-- ============================================

-- Gammes AXA France
INSERT INTO "gammes" (id, "societeId", nom, description, icone, actif, "createdAt", "updatedAt")
VALUES
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'Santé', 'Produits de couverture santé', 'heart-pulse', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab1', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'Assistance', 'Services d''assistance et dépannage', 'phone', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab2', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'Multirisques habitation', 'Assurance habitation', 'home', true, NOW(), NOW()),
  -- Gammes Allianz France
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab3', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'Santé', 'Produits de couverture santé', 'heart-pulse', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab4', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'Décès toutes causes', 'Garanties décès et prévoyance', 'shield', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab5', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'Protection juridique', 'Défense de vos droits', 'scale', true, NOW(), NOW()),
  -- Gammes Groupama
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab6', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'Dépendance', 'Garanties perte d''autonomie', 'wheelchair', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab7', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'Garantie des accidents de la vie', 'Protection contre les accidents', 'activity', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab8', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'Obsèque', 'Capital obsèques', 'flower', true, NOW(), NOW()),
  -- Gammes MAIF
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaab9', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'Multirisques habitation', 'Assurance habitation', 'home', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaba0', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'Assistance', 'Services d''assistance', 'phone', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaba1', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'Santé', 'Mutuelle santé', 'heart-pulse', true, NOW(), NOW()),
  -- Gammes Generali France
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaba2', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'Protection juridique', 'Défense de vos droits', 'scale', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaba3', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'Décès toutes causes', 'Garanties décès et prévoyance', 'shield', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaba4', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'Garantie des accidents de la vie', 'Protection contre les accidents', 'activity', true, NOW(), NOW()),
  ('eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaba5', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'Obsèque', 'Capital obsèques', 'flower', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 11. Produits (Catalogue)
-- ============================================

-- Produits AXA France
INSERT INTO "produits" (id, "societeId", "gammeId", sku, nom, description, categorie, type, prix, "tauxTVA", devise, fournisseur, actif, "createdAt", "updatedAt")
VALUES
  -- Santé (gamme gggggggg-gggg-gggg-gggg-gggggggggg01)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a001', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'gggggggg-gggg-gggg-gggg-gggggggggg01', 'AXA-SANTE-001', 'AXA Santé Essentiel', 'Formule santé de base avec remboursements essentiels', 'Santé', 'Partenaire', 45.90, 20, 'EUR', 'AXA France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a002', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'gggggggg-gggg-gggg-gggg-gggggggggg01', 'AXA-SANTE-002', 'AXA Santé Confort', 'Formule santé intermédiaire avec optique et dentaire renforcés', 'Santé', 'Partenaire', 89.50, 20, 'EUR', 'AXA France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a003', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'gggggggg-gggg-gggg-gggg-gggggggggg01', 'AXA-SANTE-003', 'AXA Santé Premium', 'Formule santé haut de gamme avec hospitalisation illimitée', 'Santé', 'Partenaire', 145.00, 20, 'EUR', 'AXA France', true, NOW(), NOW()),
  -- Assistance (gamme gggggggg-gggg-gggg-gggg-gggggggggg02)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a004', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'gggggggg-gggg-gggg-gggg-gggggggggg02', 'AXA-ASSIST-001', 'AXA Assistance Auto', 'Assistance dépannage et remorquage 24h/24', 'Assistance', 'Partenaire', 12.90, 20, 'EUR', 'AXA France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a005', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'gggggggg-gggg-gggg-gggg-gggggggggg02', 'AXA-ASSIST-002', 'AXA Assistance Voyage', 'Assistance rapatriement et frais médicaux à l''étranger', 'Assistance', 'Partenaire', 8.50, 20, 'EUR', 'AXA France', true, NOW(), NOW()),
  -- MRH (gamme gggggggg-gggg-gggg-gggg-gggggggggg03)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a006', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'gggggggg-gggg-gggg-gggg-gggggggggg03', 'AXA-MRH-001', 'AXA Habitation Essentiel', 'Assurance habitation formule économique', 'Multirisques habitation', 'Partenaire', 15.90, 20, 'EUR', 'AXA France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a007', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'gggggggg-gggg-gggg-gggg-gggggggggg03', 'AXA-MRH-002', 'AXA Habitation Confort', 'Assurance habitation avec garanties étendues', 'Multirisques habitation', 'Partenaire', 28.50, 20, 'EUR', 'AXA France', true, NOW(), NOW()),

-- Produits Allianz France
  -- Santé (gamme gggggggg-gggg-gggg-gggg-gggggggggg04)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a008', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'gggggggg-gggg-gggg-gggg-gggggggggg04', 'ALZ-SANTE-001', 'Allianz Santé Initial', 'Couverture santé de base pour les budgets serrés', 'Santé', 'Partenaire', 42.00, 20, 'EUR', 'Allianz France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a009', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'gggggggg-gggg-gggg-gggg-gggggggggg04', 'ALZ-SANTE-002', 'Allianz Santé Équilibre', 'Couverture santé équilibrée qualité/prix', 'Santé', 'Partenaire', 78.00, 20, 'EUR', 'Allianz France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a010', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'gggggggg-gggg-gggg-gggg-gggggggggg04', 'ALZ-SANTE-003', 'Allianz Santé Sérénité', 'Couverture santé complète sans souci', 'Santé', 'Partenaire', 125.00, 20, 'EUR', 'Allianz France', true, NOW(), NOW()),
  -- Décès toutes causes (gamme gggggggg-gggg-gggg-gggg-gggggggggg05)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a011', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'gggggggg-gggg-gggg-gggg-gggggggggg05', 'ALZ-DTC-001', 'Allianz Capital Décès', 'Garantie décès capital versé aux bénéficiaires', 'Décès toutes causes', 'Partenaire', 18.90, 20, 'EUR', 'Allianz France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a012', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'gggggggg-gggg-gggg-gggg-gggggggggg05', 'ALZ-DTC-002', 'Allianz Famille Protégée', 'Protection familiale en cas de décès avec rente', 'Décès toutes causes', 'Partenaire', 32.50, 20, 'EUR', 'Allianz France', true, NOW(), NOW()),
  -- Protection juridique (gamme gggggggg-gggg-gggg-gggg-gggggggggg06)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a013', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'gggggggg-gggg-gggg-gggg-gggggggggg06', 'ALZ-PJ-001', 'Allianz Protection Juridique', 'Défense de vos droits au quotidien', 'Protection juridique', 'Partenaire', 9.90, 20, 'EUR', 'Allianz France', true, NOW(), NOW()),

-- Produits Groupama
  -- Dépendance (gamme gggggggg-gggg-gggg-gggg-gggggggggg07)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a014', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'gggggggg-gggg-gggg-gggg-gggggggggg07', 'GRP-DEP-001', 'Groupama Autonomie', 'Garantie dépendance avec rente mensuelle', 'Dépendance', 'Partenaire', 35.00, 20, 'EUR', 'Groupama', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a015', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'gggggggg-gggg-gggg-gggg-gggggggggg07', 'GRP-DEP-002', 'Groupama Autonomie Plus', 'Garantie dépendance renforcée avec services', 'Dépendance', 'Partenaire', 55.00, 20, 'EUR', 'Groupama', true, NOW(), NOW()),
  -- GAV (gamme gggggggg-gggg-gggg-gggg-gggggggggg08)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a016', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'gggggggg-gggg-gggg-gggg-gggggggggg08', 'GRP-GAV-001', 'Groupama GAV Famille', 'Garantie accidents de la vie pour toute la famille', 'Garantie des accidents de la vie', 'Partenaire', 14.50, 20, 'EUR', 'Groupama', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a017', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'gggggggg-gggg-gggg-gggg-gggggggggg08', 'GRP-GAV-002', 'Groupama GAV Intégrale', 'Protection maximale contre tous les accidents', 'Garantie des accidents de la vie', 'Partenaire', 22.00, 20, 'EUR', 'Groupama', true, NOW(), NOW()),
  -- Obsèque (gamme gggggggg-gggg-gggg-gggg-gggggggggg09)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a018', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'gggggggg-gggg-gggg-gggg-gggggggggg09', 'GRP-OBS-001', 'Groupama Obsèques Sérénité', 'Capital obsèques pour financer les funérailles', 'Obsèque', 'Partenaire', 19.90, 20, 'EUR', 'Groupama', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a019', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'gggggggg-gggg-gggg-gggg-gggggggggg09', 'GRP-OBS-002', 'Groupama Obsèques Prestige', 'Capital obsèques premium avec prestations incluses', 'Obsèque', 'Partenaire', 38.00, 20, 'EUR', 'Groupama', true, NOW(), NOW()),

-- Produits MAIF
  -- MRH (gamme gggggggg-gggg-gggg-gggg-gggggggggg10)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a020', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'gggggggg-gggg-gggg-gggg-gggggggggg10', 'MAIF-MRH-001', 'MAIF Habitation Responsable', 'Assurance habitation éco-responsable', 'Multirisques habitation', 'Partenaire', 18.00, 20, 'EUR', 'MAIF', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a021', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'gggggggg-gggg-gggg-gggg-gggggggggg10', 'MAIF-MRH-002', 'MAIF Habitation Complète', 'Assurance habitation tous risques', 'Multirisques habitation', 'Partenaire', 32.00, 20, 'EUR', 'MAIF', true, NOW(), NOW()),
  -- Assistance (gamme gggggggg-gggg-gggg-gggg-gggggggggg11)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a022', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'gggggggg-gggg-gggg-gggg-gggggggggg11', 'MAIF-ASSIST-001', 'MAIF Assistance 24h', 'Assistance complète jour et nuit', 'Assistance', 'Partenaire', 7.90, 20, 'EUR', 'MAIF', true, NOW(), NOW()),
  -- Santé (gamme gggggggg-gggg-gggg-gggg-gggggggggg12)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a023', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'gggggggg-gggg-gggg-gggg-gggggggggg12', 'MAIF-SANTE-001', 'MAIF Santé Solidaire', 'Mutuelle santé solidaire et responsable', 'Santé', 'Partenaire', 52.00, 20, 'EUR', 'MAIF', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a024', 'cccccccc-cccc-cccc-cccc-cccccccccc04', 'gggggggg-gggg-gggg-gggg-gggggggggg12', 'MAIF-SANTE-002', 'MAIF Santé Famille', 'Mutuelle santé pour toute la famille', 'Santé', 'Partenaire', 98.00, 20, 'EUR', 'MAIF', true, NOW(), NOW()),

-- Produits Generali France
  -- Protection juridique (gamme gggggggg-gggg-gggg-gggg-gggggggggg13)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a025', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'gggggggg-gggg-gggg-gggg-gggggggggg13', 'GEN-PJ-001', 'Generali Défense Plus', 'Protection juridique étendue vie privée et pro', 'Protection juridique', 'Partenaire', 11.90, 20, 'EUR', 'Generali France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a026', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'gggggggg-gggg-gggg-gggg-gggggggggg13', 'GEN-PJ-002', 'Generali Défense Premium', 'Protection juridique haut de gamme', 'Protection juridique', 'Partenaire', 24.00, 20, 'EUR', 'Generali France', true, NOW(), NOW()),
  -- Décès toutes causes (gamme gggggggg-gggg-gggg-gggg-gggggggggg14)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a027', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'gggggggg-gggg-gggg-gggg-gggggggggg14', 'GEN-DTC-001', 'Generali Prévoyance Décès', 'Capital décès garanti pour vos proches', 'Décès toutes causes', 'Partenaire', 15.50, 20, 'EUR', 'Generali France', true, NOW(), NOW()),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a028', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'gggggggg-gggg-gggg-gggg-gggggggggg14', 'GEN-DTC-002', 'Generali Héritage', 'Transmission optimisée du capital', 'Décès toutes causes', 'Partenaire', 42.00, 20, 'EUR', 'Generali France', true, NOW(), NOW()),
  -- GAV (gamme gggggggg-gggg-gggg-gggg-gggggggggg15)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a029', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'gggggggg-gggg-gggg-gggg-gggggggggg15', 'GEN-GAV-001', 'Generali Accidents Vie', 'Protection contre les accidents du quotidien', 'Garantie des accidents de la vie', 'Partenaire', 12.00, 20, 'EUR', 'Generali France', true, NOW(), NOW()),
  -- Obsèque (gamme gggggggg-gggg-gggg-gggg-gggggggggg16)
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a030', 'cccccccc-cccc-cccc-cccc-cccccccccc05', 'gggggggg-gggg-gggg-gggg-gggggggggg16', 'GEN-OBS-001', 'Generali Sérénité Obsèques', 'Capital obsèques avec accompagnement', 'Obsèque', 'Partenaire', 25.00, 20, 'EUR', 'Generali France', true, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Résumé des données insérées
-- ============================================
--
-- Organisations: 1 (Finanssor)
-- Utilisateurs (commerciaux): 2
-- Sociétés (compagnies): 5 (AXA, Allianz, Groupama, MAIF, Generali)
-- Clients: 10 (5 particuliers, 5 entreprises)
-- Adresses: 10
-- Contrats: 10 (8 actifs, 1 en attente, 1 brouillon)
-- Produits: 30 (répartis sur 5 sociétés et 8 gammes)
--
-- Gammes couvertes:
-- - Santé (8 produits)
-- - Assistance (3 produits)
-- - Multirisques habitation (4 produits)
-- - Décès toutes causes (4 produits)
-- - Protection juridique (3 produits)
-- - Dépendance (2 produits)
-- - GAV (3 produits)
-- - Obsèque (3 produits)
-- ============================================

SELECT 'Seed completed successfully!' as message;
SELECT 'Clients insérés: ' || COUNT(*) FROM clientbases;
SELECT 'Contrats insérés: ' || COUNT(*) FROM contrats;
SELECT 'Produits insérés: ' || COUNT(*) FROM produits;
