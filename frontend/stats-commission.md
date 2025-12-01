Cahier des charges – Module Statistiques & Reporting
1. Introduction
Le groupe Winvest Capital gère plusieurs sociétés et activités (télécom, assurance, énergie, média, conciergerie). Le CRM global doit intégrer un module Statistiques & Reporting permettant de consolider toutes les données pour offrir un pilotage du groupe.
Objectif du module
Centraliser toutes les données business et opérationnelles.
Fournir une vision claire et synthétique pour la direction.
Suivre les performances commerciales et financières.
Renforcer le contrôle qualité et la détection des risques.
Assurer la sécurité et la maîtrise des exports de données.
Enjeux
Stratégiques : meilleure prise de décision, anticipation des risques, suivi des prévisions.
Opérationnels : contrôle des performances terrain et agences.
Sécuritaires : limiter l’accès aux données sensibles et maîtriser les exports.
2. Objectifs fonctionnels
Vision consolidée groupe et vision par société.
Suivi multi-niveaux (Direction, Managers, Commerciaux).
Reporting financier, commercial et opérationnel.
Indicateurs dynamiques avec filtres (période, société, produit, commercial, canal).
Projection et prévisions à 3/6/12 mois.
3. KPIs stratégiques
3.1 Business
Nombre de contrats actifs (global, société, produit, canal).
Nouveaux clients et nouveau produit (par période, commercial, agence).
Taux de résiliation (mensuel, trimestriel, annuel).
Taux et montants d’impayés et par motif (Slimpay, MultiSafepay, Emerchantpay…).
Chiffre d’affaires (MRR, ARR, par société et produit).
Prévisions (facturation, encaissements, récurrents).
3.2 Performance commerciale
Classement commerciaux/agences.
Taux de conversion prospects → contrats.
Panier moyen par commercial.
3.3 Risques & Qualité
Alertes impayés (au-dessus d’un seuil défini).
Alertes résiliations anormales.
Contrats rejetés au contrôle qualité (par motif).
Taux de doublons clients détectés.
3.4 Opérationnels
Délai moyen validation CQ → activation.
Durée de vie moyenne client.
Pipeline : contrats en attente de validation/activation.
4. Gestion des droits d’accès
Rôles et périmètres
Direction Groupe : accès total, exports illimités.
Managers : accès limité à leur société/agence, exports sur 2 mois glissants maximum.
Commerciaux : accès à leurs propres clients actifs, export limité à leurs contrats en cours.
Mécanismes de sécurité
Blocage export hors périmètre autorisé.
Traçabilité des exports (logs utilisateur, date, périmètre).
Exports chiffrés et expirants sous 48h.
Tableau de suivi des exports (visible par la Direction uniquement).
5. UX & Interfaces
Vue Direction Groupe
Tableau de bord consolidé groupe.
KPI financiers & opérationnels.
Graphiques 12 mois glissants + projections.
Vue Manager
Tableau de bord société/agence.
Objectifs vs Réalisés.
Classement commerciaux.
Vue Commercial
Mes ventes, mes commissions, mes clients actifs.
Objectifs personnels vs atteints.
Filtres et modes
Filtres dynamiques (période, société, produit, commercial, canal).
Affichage chiffres ou graphiques.
Exports contrôlés selon droits.
6. Sécurité & Conformité
RBAC (Role Based Access Control).
Masquage des champs sensibles (RIB, pièces justificatives).
Exports chiffrés avec expiration automatique.
Audit log obligatoire sur toute action d’export.
7. Architecture technique
DataWarehouse centralisé (SQL/BigQuery).
Connecteurs CRM → Datalake (temps réel ou batch).
Moteur BI intégré (Metabase, PowerBI, Tableau).
API Reporting (REST/GraphQL) pour intégrations futures.
8. Annexes prévues
Annexe A : Schéma de données indicateurs (tables SQL + JSON schemas).
Annexe B : Liste des KPIs détaillés (définitions + formules).
Annexe C : Matrice des droits d’accès & exports.
Annexe D : UX – Maquettes écrans clés.
Annexe E : Sécurité – Procédures de logs & restrictions d’exports.
Annexe F : Gouvernance reporting & calendrier de consolidation.
Annexe A — Schémas de données (Statistiques & Reporting)
0) Portée & conventions
Périmètre : module Statistiques & Reporting du CRM Groupe Winvest Capital (multi-sociétés / multi-produits / multi-canaux).
Couches : Source (CRM/PSP), Staging, DWH (modèle en étoile), Vues KPI (matérialisées), API.
Clés : *_sk (surrogate key int), *_bk (business key string), fk_* (foreign key), dates en date_id (YYYYMMDD int).
Temps : mesures en instant T (snapshots) + événementiel (facts à la date d’événement).
Sécurité : RBAC en DWH, masquage champs sensibles, vues restreintes par rôle.
1) Modèle conceptuel (vue d’ensemble)
Dimensions communes (1:N avec les faits) :
dim_date (calendrier)
dim_company (sociétés : FT, MTV, AP, SFPP, USGP, etc.)
dim_product (offres/produits : télécom, énergie, assurance, média, conciergerie)
dim_channel (canaux : porte-à-porte, télévente, web, partenaires)
dim_agency (agences/points de vente)
dim_user (commerciaux, managers, ADV, direction)
dim_contract_status (prospect, en validation CQ, actif, suspendu, résilié, etc.)
dim_payment_method (SEPA, CB, PayPal, etc.)
dim_quality_status (CQ : validé, rejeté, motif)
dim_geo (pays, département, ville)
dim_resiliation_reason (impayé, insatisfaction, migration, autre)
Tables de faits (measures/metrics) :
f_new_sales (contrat signé / prise d’effet)
f_contract_snapshot (photo quotidienne des contrats)
f_billing (facturation/avoirs)
f_payment (paiements et rejets)
f_churn (résiliation)
f_quality_control (contrôle qualité)
f_commission_projection (projection commissions)
f_export_log (traçabilité exports)
f_login_audit (audit connexions/consultations sensibles)
Tables de pont (M:N) :
bridge_contract_product (contrat ↔ composantes produit)
bridge_user_agency (affectations d’un commercial à N agences sur des périodes)
2) Détails des tables (clés, colonnes, cardinalités)
2.1 Dimensions
dim_company
company_sk (PK), company_bk (SIREN/SIRET), name, brand_code, active_flag.
Cardinalité : 1 (company) → N (facts).
dim_product
product_sk (PK), product_bk, family (télécom/énergie/assurance/média/conciergerie), subcategory, offer_code, mrr_flag, unit_price_ht, currency.
dim_channel
channel_sk (PK), code, label (porte-à-porte, télévente, inbound, partenaire, web), source_partner (OHM, Plénitude, SFR... optionnel).
dim_agency
agency_sk (PK), agency_bk, company_sk (FK), name, type (interne/partenaire), geo_sk.
dim_user
user_sk (PK), user_bk (UUID SSO), company_sk (FK), full_name, role (DIRECTION/MANAGER/COMMERCIAL/ADV), hiring_date, leaving_date (NULL si actif).
dim_contract_status
status_sk (PK), code (PROSPECT/EN_CQ/ACTIF/SUSPENDU/RESILIE), rank (ordre progression), is_active_flag.
dim_payment_method
pm_sk (PK), code (SEPA/CB/PayPal/etc.), processor (Slimpay, MultiSafepay, Emerchantpay), ics_code (si SEPA), fees_bps.
dim_quality_status
qc_sk (PK), code (VALIDE/REJETE/EN_ATTENTE), reason_code, reason_label.
dim_geo
geo_sk (PK), country, region, department, city, zipcode.
dim_resiliation_reason
reason_sk (PK), code (IMPAYE/INSATISFACTION/MIGRATION/AUTRE), label.
2.2 Faits
f_new_sales (grain : 1 ligne par contrat à la signature/prise d’effet)
PK sale_id (surrogate)
FK company_sk, product_sk, channel_sk, agency_sk, user_sk, date_id (prise d’effet)
Métriques : prime_ttc, prime_ht, fees_management_ht, commission_initiale_ht, expected_mrr_ht, currency
f_contract_snapshot (grain : contrat x jour)
PK composite : contract_bk, date_id
FK company_sk, product_sk, user_sk, agency_sk, status_sk, pm_sk
Attributs snapshot : is_active_flag, mrr_ht, arr_ht, age_days, start_date_id, end_date_id
f_billing (grain : document de facturation ou ligne selon besoin)
PK billing_id
FK company_sk, product_sk, user_sk, contract_bk, date_id
Champs : invoice_number, type (FACTURE/AVOIR), amount_ht, amount_ttc, tax_rate, currency
f_payment (grain : transaction de paiement/rejet)
PK payment_id
FK company_sk, contract_bk, pm_sk, date_id
Champs : processor_ref, amount_ttc, status (SUCCES/REJET), reject_reason_code, retry_count, settlement_date_id
f_churn (grain : événement résiliation)
PK churn_id
FK company_sk, contract_bk, product_sk, user_sk, date_id, reason_sk
Champs : is_forced_flag (impayé), lifetime_days, last_mrr_ht
f_quality_control (grain : événement CQ)
PK cq_id
FK company_sk, contract_bk, qc_sk, user_sk, date_id
Champs : partner_source (OHM/Plénitude/SFR/Interne), notes
f_commission_projection (grain : contrat x période de projection)
PK comm_proj_id
FK company_sk, contract_bk, user_sk, date_id
Champs : year_n_commission_ht, recurring_commission_ht, grid_version, assumed_churn_prob
f_export_log (grain : 1 export utilisateur)
PK export_id
FK user_sk, company_sk, date_id
Champs : scope (SELF/AGENCY/COMPANY/GROUP), format (CSV/XLSX), rows_count, file_uri (chiffré), expires_at, status (OK/BLOCKED)
f_login_audit (grain : 1 événement d’auth/consultation)
PK audit_id
FK user_sk, date_id
Champs : action (LOGIN/VIEW_EXPORT/VIEW_KPI), object_ref, ip_hash
2.3 Bridges
bridge_contract_product
PK composite (contract_bk, product_sk)
Règle : permet packs multi-produits (pondération %alloc_mrr).
bridge_user_agency
PK user_agency_id
FK user_sk, agency_sk
Champs : valid_from_date_id, valid_to_date_id
3) Cardinalités clés
dim_company (1) → (N) f_* — toutes les mesures rattachées à une société.
dim_user (1) → (N) f_new_sales / f_contract_snapshot / f_commission_projection.
dim_product (1) → (N) f_* ; bridge_contract_product gère le M:N contrat↔produits.
f_contract_snapshot (contract_bk,date_id) fournit l’état pour KPIs actifs.
4) Exemples DDL (SQL)
Syntaxe compatible Postgres/BigQuery (adapter types).
CREATE TABLE dim_company (
company_sk BIGSERIAL PRIMARY KEY,
company_bk TEXT UNIQUE NOT NULL,
name TEXT NOT NULL,
brand_code TEXT,
active_flag BOOLEAN DEFAULT TRUE
);
CREATE TABLE f_contract_snapshot (
contract_bk TEXT NOT NULL,
date_id INT NOT NULL,
company_sk BIGINT NOT NULL REFERENCES dim_company(company_sk),
product_sk BIGINT REFERENCES dim_product(product_sk),
user_sk BIGINT REFERENCES dim_user(user_sk),
agency_sk BIGINT REFERENCES dim_agency(agency_sk),
status_sk BIGINT REFERENCES dim_contract_status(status_sk),
pm_sk BIGINT REFERENCES dim_payment_method(pm_sk),
is_active_flag BOOLEAN NOT NULL,
mrr_ht NUMERIC(18,4),
arr_ht NUMERIC(18,4),
age_days INT,
start_date_id INT,
end_date_id INT,
PRIMARY KEY (contract_bk, date_id)
);
CREATE TABLE f_export_log (
export_id BIGSERIAL PRIMARY KEY,
user_sk BIGINT NOT NULL REFERENCES dim_user(user_sk),
company_sk BIGINT REFERENCES dim_company(company_sk),
date_id INT NOT NULL,
scope TEXT CHECK (scope IN ('SELF','AGENCY','COMPANY','GROUP')),
format TEXT CHECK (format IN ('CSV','XLSX','JSON')),
rows_count INT,
file_uri TEXT, -- chiffré + stockage objet
expires_at TIMESTAMP,
status TEXT CHECK (status IN ('OK','BLOCKED'))
);
Indexation/Partitionnement (recommandations)
Partition mensuelle des tables volumineuses : f_contract_snapshot, f_billing, f_payment par date_id.
Index composites sur (company_sk,date_id) et (user_sk,date_id).
Matérialisation de vues KPI.
5) Vues KPI (matérialisées)
v_kpi_contracts_active
Entrées : f_contract_snapshot (filtre is_active_flag = true)
Mesures : nbr_actifs, mrr_ht, arr_ht
Dimensions : company_sk, product_sk, agency_sk, user_sk, date_id (mois glissant)
v_kpi_churn_rate
Entrées : f_churn + base active moyenne (rolling)
Mesure : churn_rate = churned / avg_active
v_kpi_impayes
Entrées : f_payment (status=REJET)
Mesures : impayes_count, impayes_amount, retry_success_rate
v_kpi_sales_funnel
Entrées : f_new_sales + dim_channel + dim_user
Mesures : conversion par canal/commercial, panier moyen
v_kpi_commissions_projection
Entrées : f_commission_projection
Mesures : commission_m1, commission_y1, recurring_expected
6) Gouvernance des exports (règles DWH)
Vues filtrées par rôle :
vw_export_manager → filtre company_sk / agency_sk, période ≤ 2 mois.
vw_export_sales → filtre user_sk = current_user_sk() + contrats actifs seulement.
Policy RLS (Row Level Security) : activée sur toutes les vues d’export.
Triggers d’écriture dans f_export_log à chaque export (OK/BLOCKED) + purge fichiers expirés.
Exemple de politique (Postgres RLS pseudo-code) :
ALTER TABLE f_contract_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_self_active ON f_contract_snapshot
USING (user_sk = current_setting('app.user_sk')::BIGINT AND is_active_flag);
7) Schémas JSON (API)
7.1 /kpi/overview (Vue Direction)
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"type": "object",
"properties": {
"as_of": {"type": "string", "format": "date"},
"company": {"type": "string"},
"contracts_active": {"type": "integer"},
"mrr_ht": {"type": "number"},
"arr_ht": {"type": "number"},
"churn_rate_pct": {"type": "number"},
"impayes_amount": {"type": "number"},
"new_clients": {"type": "integer"}
},
"required": ["as_of","contracts_active","mrr_ht","arr_ht"]
}
7.2 /kpi/company/:id (Vue Manager)
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"type": "object",
"properties": {
"company_id": {"type": "integer"},
"period": {"type": "string", "pattern": "^\\d{4}-\\d{2}$"},
"by_product": {
"type": "array",
"items": {
"type": "object",
"properties": {
"product": {"type": "string"},
"contracts_active": {"type": "integer"},
"mrr_ht": {"type": "number"},
"churn_rate_pct": {"type": "number"}
},
"required": ["product","contracts_active"]
}
}
},
"required": ["company_id","period"]
}
7.3 /exports/log (Audit exports)
{
"$schema": "https://json-schema.org/draft/2020-12/schema",
"type": "object",
"properties": {
"export_id": {"type": "integer"},
"user_id": {"type": "integer"},
"company_id": {"type": "integer"},
"scope": {"type": "string", "enum": ["SELF","AGENCY","COMPANY","GROUP"]},
"rows_count": {"type": "integer"},
"status": {"type": "string", "enum": ["OK","BLOCKED"]},
"created_at": {"type": "string", "format": "date-time"}
},
"required": ["export_id","user_id","scope","status","created_at"]
}
8) Qualité de données & SLA
Tests : unicite contract_bk, cohérence statuts (pas ACTIF après RESILIE), devise non nulle.
Rapprochement PSP : taux de matching paiements ≥ 99,5% (processor refs).
SLA :
Snapshots actifs : J+0 H+1 (horaire)
Paiements/impayés : J+0 H+2 (webhooks + rattrapage)
Facturation : J+0 H+3
Rétention : faits d’audit/export 24 mois, snapshots 36 mois.
9) Notes de mise en œuvre
Historisation SCD2 pour dim_user, dim_agency, dim_product.
Masquage (RIB, IBAN, pièces) hors périmètres export autorisés.
Jobs d’orchestration (Airflow/Prefect) avec journaux d’échec + relance.
Monitoring : métriques pipeline (latence, lignes ingérées, échecs).
10) Récapitulatif clé (pour dév)
Grain uniforme et clair par table de faits.
v_kpi_ matérialisées* pour performance des dashboards.
RLS + vues d’export pour implémenter la stratégie :
Direction : illimité
Manager : périmètre société/2 mois
Commercial : self + actifs only
Audit à 100 % des exports et consultations sensibles.
Annexe B — KPIs détaillés (Statistiques & Reporting)
0) Portée
Cette annexe définit les indicateurs clés de performance (KPIs) suivis par le module Statistiques & Reporting du CRM Groupe Winvest Capital. Chaque KPI est documenté avec :
Nom du KPI
Définition
Formule de calcul
Sources de données (tables / vues DWH)
Périmètre (Direction / Manager / Commercial)
Fréquence de mise à jour
1) KPIs Business
1.1 Nombre de contrats actifs
Définition : total des contrats dont le statut est ACTIF à une date donnée.
Formule :
SELECT COUNT(*)
FROM f_contract_snapshot
WHERE is_active_flag = TRUE;
Source : f_contract_snapshot
Périmètre : Direction (toutes sociétés), Manager (société/ agence), Commercial (ses clients).
MàJ : horaire (H+1)
1.2 Nouveaux clients (période)
Définition : nombre de nouveaux contrats dont la date de prise d’effet ∈ période sélectionnée.
Formule :
SELECT COUNT(*)
FROM f_new_sales
WHERE date_id BETWEEN :start AND :end;
Source : f_new_sales
Périmètre : idem ci-dessus.
MàJ : temps réel (event-driven)
1.3 Taux de résiliation (churn)
Définition : ratio des contrats résiliés sur la base moyenne des actifs d’une période.
Formule :
churn_rate = (nbr_resiliations / avg_nbr_actifs) * 100
Source : f_churn + f_contract_snapshot
Périmètre : Direction, Manager
MàJ : quotidien
1.4 Taux d’impayés
Définition : proportion des paiements rejetés sur le total des transactions d’une période.
Formule :
impayes_rate = (nbr_rejets / total_paiements) * 100
Source : f_payment
Périmètre : Direction, Manager
MàJ : quasi temps réel (webhooks PSP)
1.5 Montant impayés
Définition : somme des montants TTC des transactions rejetées.
Formule : SUM(amount_ttc WHERE status = 'REJET')
Source : f_payment
Périmètre : Direction, Manager
MàJ : temps réel (webhooks)
1.6 Chiffre d’affaires récurrent (MRR/ARR)
Définition : revenus récurrents mensuels / annuels.
Formule :
MRR = SUM(mrr_ht)
ARR = SUM(arr_ht)
Source : f_contract_snapshot
Périmètre : Direction, Manager
MàJ : horaire
1.7 Prévisions facturation/CA
Définition : projection des revenus attendus à partir des contrats actifs et pipeline.
Formule : SUM(expected_mrr_ht) + modélisation churn/probabilité pipeline.
Source : f_new_sales, f_contract_snapshot, f_commission_projection
Périmètre : Direction uniquement
MàJ : quotidien
2) KPIs Commerciaux
2.1 Classement commerciaux (ventes)
Définition : classement par nombre de ventes signées sur période.
Formule : RANK() OVER (ORDER BY COUNT(f_new_sales) DESC)
Source : f_new_sales
Périmètre : Direction (global), Manager (par société/équipe)
MàJ : temps réel
2.2 Taux de conversion prospects → contrats
Définition : ratio des prospects transformés en contrats signés.
Formule :
conversion_rate = (nbr_contrats_signes / nbr_prospects) * 100
Source : CRM (prospects) + f_new_sales
Périmètre : Direction, Manager
MàJ : quotidien
2.3 Panier moyen par commercial
Définition : prime HT moyenne par contrat signé.
Formule : AVG(prime_ht)
Source : f_new_sales
Périmètre : Manager, Commercial (perso)
MàJ : temps réel
3) KPIs Risques & Qualité
3.1 Alertes impayés
Définition : déclenchement si impayes_rate > seuil% (par défaut 5%).
Formule : alerte booléenne sur impayes_rate.
Source : v_kpi_impayes
Périmètre : Direction, Manager
MàJ : temps réel
3.2 Alertes churn
Définition : déclenchement si churn_rate > seuil% (par défaut 10%).
Formule : alerte booléenne sur churn_rate.
Source : v_kpi_churn_rate
Périmètre : Direction, Manager
MàJ : quotidien
3.3 Contrats rejetés au CQ
Définition : nombre/ratio de contrats rejetés par rapport aux contrats soumis.
Formule :
cq_reject_rate = (nbr_rejetes / nbr_total_cq) * 100
Source : f_quality_control
Périmètre : Direction, Manager, ADV
MàJ : temps réel
3.4 Doublons clients
Définition : proportion de doublons identifiés vs total base.
Formule : doublons_rate = (doublons_detectes / total_clients) * 100
Source : moteur GED/cleaner + CRM
Périmètre : Direction, ADV
MàJ : hebdo
4) KPIs Opérationnels
4.1 Délai validation CQ → activation
Définition : temps moyen entre validation contrôle qualité et activation effective du contrat.
Formule : AVG(date_activation - date_validation_cq)
Source : f_quality_control + f_contract_snapshot
Périmètre : Direction, Manager
MàJ : quotidien
4.2 Durée de vie client moyenne (LTV)
Définition : moyenne du nombre de jours entre début contrat et résiliation.
Formule : AVG(lifetime_days)
Source : f_churn
Périmètre : Direction
MàJ : mensuel
4.3 Pipeline contrats en attente
Définition : volume de contrats en statut EN_CQ ou EN_ATTENTE_VALIDATION.
Formule : COUNT(*) WHERE status IN ('EN_CQ','EN_ATTENTE_VALIDATION')
Source : f_contract_snapshot
Périmètre : Direction, Manager
MàJ : horaire
5) Projection commissions
5.1 Commission 1ère année
Définition : montant des commissions attendues pour l’année N.
Formule : SUM(year_n_commission_ht)
Source : f_commission_projection
Périmètre : Direction, Manager
MàJ : quotidien
5.2 Commission récurrente annuelle
Définition : montant des commissions récurrentes attendues hors 1ère année.
Formule : SUM(recurring_commission_ht)
Source : f_commission_projection
Périmètre : Direction
MàJ : mensuel
6) Gouvernance KPIs
Tous les KPIs sont documentés et versionnés.
Chaque KPI est lié à une vue matérialisée dans le DWH (v_kpi_*).
Les seuils d’alerte sont paramétrables (configurable via admin CRM).
Les KPIs utilisés pour primes commerciales doivent être validés par la DAF.
7) Fréquences de mise à jour (SLA)
Temps réel (<5 min) : ventes, paiements, impayés, rejets CQ.
Horaire (H+1) : contrats actifs, CA récurrent.
Quotidien : churn, pipeline, prévisions.
Mensuel : durée de vie client moyenne, commissions récurrentes.
8) Récapitulatif
KPI
Source
Fréquence
Périmètre
Contrats actifs
f_contract_snapshot
Horaire
Tous
Nouveaux clients
f_new_sales
Temps réel
Tous
Taux de résiliation
f_churn + snapshot
Quotidien
Dir, Mgr
Taux d’impayés
f_payment
Temps réel
Dir, Mgr
CA récurrent (MRR/ARR)
f_contract_snapshot
Horaire
Dir, Mgr
Classement commerciaux
f_new_sales
Temps réel
Dir, Mgr
Conversion prospects
CRM + f_new_sales
Quotidien
Dir, Mgr
Contrats rejetés CQ
f_quality_control
Temps réel
Dir, Mgr, ADV
Délai CQ→Activation
f_quality_control + snapshot
Quotidien
Dir, Mgr
Durée de vie client (LTV)
f_churn
Mensuel
Dir
Projections commissions
f_commission_projection
Quotidien
Dir, Mgr
Annexe C — Droits d’accès & Exports (Statistiques & Reporting)
0) Objectif
Garantir une sécurité stricte des données statistiques et reporting en contrôlant :
Les périmètres d’accès (qui peut voir quoi).
Les exports autorisés ou interdits selon le rôle.
La traçabilité de toutes les actions sensibles.
1) Rôles et périmètres d’accès
1.1 Direction Groupe
Périmètre : toutes sociétés, tous produits, toutes périodes.
Accès : complet sur tous les KPIs et dashboards.
Exports : illimités (Excel, CSV, JSON, API BI).
Restrictions : aucune.
Logs : export tracé systématiquement.
1.2 Directeur de société / Manager
Périmètre : uniquement la société/agence qu’il dirige.
Accès :
KPIs consolidés de sa société/agence.
Classement de ses commerciaux.
Alertes impayés, churn et CQ pour son périmètre.
Exports :
Autorisés mais limités à 2 mois glissants maximum.
Formats autorisés : CSV/XLSX (pas d’API BI globale).
Restrictions :
Pas d’accès multi-sociétés.
Pas d’historique complet (> 2 mois).
Logs : export tracé et contrôlé.
1.3 Commerciaux
Périmètre : uniquement leurs propres clients actifs.
Accès :
Tableau de bord personnel (ventes, commissions, objectifs).
Liste de leurs contrats en cours.
Exports :
Limité aux contrats actifs du commercial.
Pas d’accès aux historiques ni aux données des autres.
Restrictions :
Export bloqué si > 500 lignes.
Pas de CA global ni de données consolidées.
Logs : export tracé.
1.4 ADV / Qualité
Périmètre : uniquement leur périmètre opérationnel (contrats soumis au CQ, impayés en recouvrement).
Accès :
Statuts CQ (validé/rejeté).
Suivi des impayés par portefeuille attribué.
Exports :
Limités aux fichiers de travail (contrats rejetés, relances impayés).
Pas d’accès consolidé CA/ventes.
2) Matrice de droits (RACI simplifié)
Rôle
Voir KPIs Groupe
Voir Société
Voir Clients Perso
Export illimité
Export 2 mois
Export limité perso
Direction
✅
✅
✅
✅
✅
✅
Manager
❌
✅
❌
❌
✅
❌
Commercial
❌
❌
✅
❌
❌
✅
ADV/Qualité
❌
❌
partiel (CQ/impayés)
❌
partiel
✅
3) Stratégie exports
3.1 Règles générales
Les exports sont chiffrés et stockés en lien temporaire (expirant sous 48h).
Chaque export déclenche une écriture dans f_export_log (Annexe A).
Des quotas peuvent être fixés (ex : max 10 exports/jour/utilisateur non-direction).
3.2 Blocages automatiques
Blocage si :
Manager tente d’exporter > 2 mois.
Commercial tente d’exporter un client hors périmètre.
ADV tente d’exporter CA consolidé.
En cas de blocage : écriture status = BLOCKED dans f_export_log + notification à l’administrateur.
3.3 Formats autorisés
Direction : CSV, XLSX, JSON API, intégrations BI (PowerBI/Tableau).
Manager : CSV, XLSX.
Commerciaux : CSV simple (UTF-8, max 500 lignes).
ADV : fichiers de travail CSV (CQ, impayés).
4) Gouvernance & Sécurité
RBAC appliqué au niveau DWH (Row Level Security).
Vues filtrées par rôle (vw_export_manager, vw_export_sales).
Audit complet des exports dans f_export_log.
Surveillance automatisée : alertes si export massif suspect (> 50k lignes, hors direction).
Rotation des accès : droits revus trimestriellement (avec DSI).
5) Exemple de scénarios
Scénario 1 – Export Manager
Manager FT tente d’exporter 6 mois de CA.
RLS filtre → limitation à 2 mois.
Export généré sur 2 mois, log OK.
Scénario 2 – Export Commercial
Commercial essaie d’exporter tous les clients d’une agence.
Blocage → log BLOCKED, admin notifié.
Scénario 3 – Direction
DG exporte historique complet CA Groupe depuis 2019.
Export généré (format XLSX, JSON API).
Log OK, pas de restriction.
6) Résumé
Direction : liberté totale.
Managers : exports limités à 2 mois, périmètre société.
Commerciaux : exports personnels uniquement (contrats actifs).
ADV : exports limités aux cas opérationnels.
Tous exports tracés et sécurisés.
Annexe D — UX Écrans Clés (Statistiques & Reporting)
0) Objectif
Définir les interfaces utilisateurs principales du module Statistiques & Reporting pour le CRM Groupe Winvest Capital. Les écrans doivent être :
Simples et intuitifs.
Visuellement hiérarchisés (KPI principaux en haut, détails en bas).
Cohérents avec l’identité graphique du CRM.
Adaptés à chaque rôle (Direction, Manager, Commercial).
1) Principes UX généraux
Tableaux de bord modulaires : chaque KPI représenté sous forme de widget.
Filtres dynamiques : période, société, produit, commercial, canal.
Modes de visualisation : graphique (courbes, barres, camemberts) + tableau chiffré.
Navigation claire : onglets pour chaque niveau (Groupe, Société, Commercial, CQ, Risques).
Alerte visuelle : codes couleurs (vert = OK, orange = attention, rouge = alerte).
Responsive : desktop (COMEX), tablette (Managers), mobile (Commerciaux).
2) Écrans Clés
2.1 Vue Direction Groupe
Objectif : vision consolidée du groupe, comparable à un reporting COMEX.
Header : sélecteur période (mois, trimestre, année).
KPIs principaux (cards) :
Contrats actifs (global).
CA récurrent MRR/ARR.
Taux de churn groupe.
Taux impayés groupe.
Graphiques :
Évolution CA (12 mois glissants).
Nouveaux clients par société.
Répartition CA par produit.
Section Risques :
Alertes impayés (> seuil).
Alertes résiliations anormales.
Export : bouton export complet (Excel/PowerBI).
2.2 Vue Manager (par société/agence)
Objectif : permettre aux directeurs de société ou responsables d’agence de suivre leurs équipes.
Header : sélecteur société/agence + période.
KPIs (cards) :
Contrats actifs société.
Nouveaux clients période.
Taux impayés société.
Taux churn société.
Graphiques :
Classement commerciaux (barres horizontales).
CA société par mois.
Conversion prospects → contrats.
Tableau : liste contrats récents (nom client, produit, statut, commercial).
Exports : bouton export limité (2 mois max).
2.3 Vue Commercial
Objectif : donner au commercial une vision de ses performances individuelles.
Header : identité commerciale + période.
KPIs (cards) :
Mes ventes du mois.
Mes clients actifs.
Mon taux de conversion.
Mes commissions attendues.
Graphiques :
Évolution de mes ventes (courbe).
Répartition de mes ventes par produit (camembert).
Tableau : mes contrats actifs (client, produit, statut, montant).
Exports : bouton export perso (max 500 lignes, contrats actifs seulement).
2.4 Vue ADV / Qualité
Objectif : faciliter le suivi des contrôles qualité et des impayés.
KPIs (cards) :
Contrats en attente CQ.
Contrats rejetés.
Impayés en cours.
Taux rejet CQ.
Tableaux :
Liste contrats en rejet (avec motif).
Liste impayés (avec statut relance).
Actions : bouton relance, bouton correction CQ.
3) Navigation & ergonomie
Sidebar gauche : menus principaux (Groupe, Société, Commercial, ADV, Risques).
Topbar : filtres globaux + export.
Widgets modulaires : drag & drop configurable par utilisateur (ex : DG veut CA en haut, Manager veut classement commerciaux en haut).
Alertes : notifications push + badges rouges dans la barre de menu.
4) Identité visuelle
Couleurs :
Vert (succès), Orange (attention), Rouge (alerte), Bleu (neutre).
Typographie : claire et homogène (Roboto / Open Sans).
Icônes : pack standard CRM (contrat, CA, client, impayé, CQ).
Graphiques : charts simples (barres, lignes, donuts) avec légendes claires.
5) Accessibilité
Respect WCAG 2.1 AA (contraste, lisibilité).
Navigation clavier possible.
Export CSV accessible aux logiciels de lecture.
6) Exemple Wireframes (textuels)
Direction Groupe
+-------------------------------------------------------+
| [Filtres: Période, Société] [Export XLSX / BI] |
+-------------------------------------------------------+
| Contrats Actifs | MRR/ARR | Churn % | Impayés % |
+-------------------------------------------------------+
| Graph: CA 12 mois glissants |
| Graph: Nouveaux clients par société |
| Graph: CA par produit |
+-------------------------------------------------------+
| Section Alertes Risques (churn, impayés) |
+-------------------------------------------------------+
Vue Manager
+-------------------------------------------+
| [Filtres: Société/Agence, Période] [Export] |
+-------------------------------------------+
| Actifs | Nouveaux clients | Impayés % | Churn % |
+-------------------------------------------+
| Graph: Classement commerciaux |
| Graph: CA société par mois |
| Graph: Conversion prospects → contrats |
+-------------------------------------------+
| Tableau contrats récents |
+-------------------------------------------+
7) Résumé
UX adaptée à chaque rôle.
KPIs en cards + graphiques + tableaux.
Navigation simple via sidebar et filtres.
Exports visibles uniquement selon droits (Annexe C).
Codes couleurs + alertes pour gestion proactive.
Annexe E — Sécurité & Procédures d’Export (Statistiques & Reporting)
0) Objectif
Assurer un niveau de sécurité maximal pour la gestion des statistiques et reportings du CRM Groupe Winvest Capital en encadrant :
Les procédures de logs (tracabilité complète).
Les restrictions d’exports selon rôles.
La protection des données sensibles (contrats, paiements, RIB, etc.).
1) Principes de sécurité
Confidentialité : seules les personnes habilitées accèdent aux données.
Intégrité : aucune altération non autorisée.
Traçabilité : toute action est loguée.
Non-répudiation : aucun utilisateur ne peut nier un export ou une consultation.
2) Procédures de logs
2.1 Logs utilisateurs
Chaque action est inscrite dans f_login_audit ou f_export_log (voir Annexe A) :
user_id
date_id
action (LOGIN, VIEW_DASHBOARD, EXPORT, VIEW_EXPORT)
object_ref (contrat, KPI, fichier exporté)
status (OK, BLOCKED)
ip_hash (empreinte anonymisée IP)
2.2 Logs exports
Tout export (OK ou BLOCKED) déclenche une écriture en base.
Champs logués : scope, format, rows_count, expires_at.
Notification envoyée en cas de tentative bloquée.
2.3 Centralisation & monitoring
Les logs sont stockés dans un SIEM interne (ex : Elastic/Graylog).
Détection automatique d’anomalies :
Tentatives d’export massif (>50k lignes).
Nombre d’exports supérieur au quota journalier.
Export hors plage horaire (ex : nuit).
3) Restrictions d’exports
3.1 Direction Groupe
Export illimité.
Formats : CSV, XLSX, JSON, API BI.
3.2 Managers
Export limité à 2 mois glissants.
Formats : CSV/XLSX.
Blocage si tentative >2 mois.
3.3 Commerciaux
Export limité à leurs clients actifs.
Max 500 lignes.
Format : CSV simple uniquement.
3.4 ADV / Qualité
Export limité à leurs cas opérationnels (CQ rejetés, impayés).
Pas d’accès consolidé CA ou Groupe.
4) Mécanismes de protection
4.1 Chiffrement fichiers exportés
Tous fichiers générés stockés avec un URI chiffré.
Expiration automatique 48h après génération.
Accès via lien signé (token JWT).
4.2 Contrôle d’accès (RBAC + RLS)
RBAC appliqué au niveau applicatif et DWH.
RLS (Row Level Security) sur les tables d’export.
Vues spécifiques par rôle (Direction, Manager, Commercial).
4.3 Masquage des champs sensibles
RIB, IBAN, pièces justificatives non exportables sauf rôle Direction.
Hachage ou masquage partiel appliqué pour ADV/Managers.
5) Procédures opérationnelles
5.1 Tentative d’export bloquée
Log en base avec status=BLOCKED.
Notification automatique à l’administrateur.
Option : suspension temporaire de compte après 3 tentatives.
5.2 Perte ou fuite de fichier
Les fichiers étant chiffrés + expirants, risque limité.
Audit du f_export_log pour identifier le responsable.
5.3 Rotation des accès
Révision trimestrielle des droits utilisateurs.
Clôture immédiate des accès en cas de départ.
6) Audit & conformité
Conformité RGPD : limitation exports + minimisation données.
Audits annuels de sécurité et conformité (interne + cabinet externe).
Plan de rotation des accès (cf. Annexe C).
Plan PRA/PCA relié aux sauvegardes (cf. Annexe F).
7) Résumé
Tous exports sont logués, tracés et chiffrés.
Restrictions strictes selon rôles.
Blocages automatiques + notifications en cas de tentative frauduleuse.
Logs centralisés et monitorés pour détection proactive.
Alignement RGPD et standards sécurité type CAC 40.
Annexe F — Gouvernance Reporting & Calendrier de Consolidation
0) Objectif
Définir les règles de gouvernance du reporting et les fréquences de consolidation des données pour garantir :
La fiabilité des indicateurs.
Une mise à jour régulière et transparente.
Une traçabilité claire des versions et publications.
1) Gouvernance du reporting
1.1 Responsabilités
Direction Groupe : définit les KPIs stratégiques, valide les seuils d’alerte.
DAF Groupe : valide les formules financières (CA, MRR, ARR, commissions).
DSI / Responsable Informatique : assure la cohérence technique (datalake, DWH, BI).
Managers de société : valident les indicateurs opérationnels terrain.
ADV/Qualité : garantissent la fiabilité des données CQ et impayés.
1.2 Processus de validation
Chaque KPI a un propriétaire (owner).
Chaque changement (formule, seuil, affichage) doit être documenté et versionné.
Validation finale par le Comité de Pilotage (COPIL).
1.3 Diffusion & communication
Rapports Groupe diffusés mensuellement au COMEX.
Rapports Société diffusés mensuellement aux DG/Managers.
Rapports individuels accessibles en temps réel (commerciaux).
2) Calendrier de consolidation
2.1 Fréquences de mise à jour
Temps réel (<5 min) : ventes, paiements, impayés, CQ.
Horaire (H+1) : contrats actifs, CA récurrent.
Quotidien (J+1) : churn, pipeline, projections CA.
Mensuel (J+3) : durée de vie client, commissions récurrentes, analyses consolidées.
2.2 Consolidation reporting
Hebdomadaire :
Tableau de bord Managers (CA semaine, ventes, impayés).
Alertes consolidées (churn, impayés).
Mensuelle :
Tableau de bord Groupe (CA consolidé, churn, impayés, prévisions).
Préparation rapport COMEX.
Trimestrielle :
Consolidation Groupe élargie (MRR/ARR, LTV, prévisions stratégiques).
Rapport pour audits externes / partenaires financiers.
2.3 SLA de disponibilité
99,9 % disponibilité des dashboards.
Données critiques (ventes, paiements) visibles en < 5 min.
Consolidation Groupe mensuelle validée au plus tard J+5 après clôture mois.
3) Contrôle & qualité des données
Tests automatiques sur cohérence données (unicité contrats, devises, statuts logiques).
Alertes si écart > 1 % entre facturation et paiements enregistrés.
Double validation DAF + DSI avant diffusion Groupe.
4) Gouvernance des exports
Voir Annexe C et Annexe E (sécurité).
Exports Groupe consolidés validés par DAF avant diffusion externe (auditeurs, partenaires).
Historisation des exports officiels dans GED interne.
5) Audit & conformité
Audit interne mensuel sur cohérence KPIs.
Audit externe annuel (cabinet indépendant).
Alignement avec normes IFRS / CAC 40 reporting.
Documentation versionnée (Wiki interne + annexes).
6) Résumé
Gouvernance claire avec rôles attribués (Direction, DAF, DSI, Managers, ADV).
Consolidation structurée : temps réel → horaire → quotidien → mensuel → trimestriel.
Contrôles automatiques + validations humaines pour fiabilité.
Rapports consolidés mensuels pour COMEX, trimestriels pour partenaires.
Alignement avec standards CAC 40 pour crédibilité et professionnalisation.