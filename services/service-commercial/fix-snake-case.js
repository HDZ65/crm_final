const fs = require('fs');
const path = require('path');

// All camelCase to snake_case mappings for proto properties
const protoProps = [
  // ID fields
  ['organisationId', 'organisation_id'],
  ['societeId', 'societe_id'],
  ['apporteurId', 'apporteur_id'],
  ['contratId', 'contrat_id'],
  ['produitId', 'produit_id'],
  ['utilisateurId', 'utilisateur_id'],
  ['commissionId', 'commission_id'],
  ['baremeId', 'bareme_id'],
  ['bordereauId', 'bordereau_id'],
  ['refId', 'ref_id'],
  ['userId', 'user_id'],
  ['validateurId', 'validateur_id'],
  ['creePar', 'cree_par'],
  ['statutId', 'statut_id'],
  ['gammeId', 'gamme_id'],
  ['grilleTarifaireId', 'grille_tarifaire_id'],
  ['ligneContratId', 'ligne_contrat_id'],
  ['ligneId', 'ligne_id'],
  ['versionId', 'version_id'],
  ['recurrenceId', 'recurrence_id'],
  ['repriseId', 'reprise_id'],
  ['palierId', 'palier_id'],
  ['documentId', 'document_id'],
  ['publicationId', 'publication_id'],
  ['statutContratId', 'statut_contrat_id'],
  
  // Type fields
  ['typeApporteur', 'type_apporteur'],
  ['typeProduit', 'type_produit'],
  ['typeCalcul', 'type_calcul'],
  ['typeBase', 'type_base'],
  ['baseCalcul', 'base_calcul'],
  ['typeContrat', 'type_contrat'],
  ['typeDocument', 'type_document'],
  ['typeRemise', 'type_remise'],
  ['typePrix', 'type_prix'],
  
  // Date fields
  ['dateFrom', 'date_from'],
  ['dateTo', 'date_to'],
  ['dateFin', 'date_fin'],
  ['dateEffet', 'date_effet'],
  ['dateCreation', 'date_creation'],
  ['dateDebut', 'date_debut'],
  ['dateValidation', 'date_validation'],
  ['datePublication', 'date_publication'],
  ['dateSignature', 'date_signature'],
  ['dateRenouvellement', 'date_renouvellement'],
  ['effectiveTo', 'effective_to'],
  ['effectiveFrom', 'effective_from'],
  ['dateChangement', 'date_changement'],
  
  // Montant fields
  ['montantBrut', 'montant_brut'],
  ['montantFixe', 'montant_fixe'],
  ['montantReprises', 'montant_reprises'],
  ['montantAcomptes', 'montant_acomptes'],
  ['montantNetAPayer', 'montant_net_a_payer'],
  ['montantNet', 'montant_net'],
  ['montantReprise', 'montant_reprise'],
  ['montantHt', 'montant_ht'],
  ['montantTtc', 'montant_ttc'],
  ['montantTva', 'montant_tva'],
  ['montantRemise', 'montant_remise'],
  ['montantTotal', 'montant_total'],
  ['prixUnitaire', 'prix_unitaire'],
  ['prixBase', 'prix_base'],
  ['prixMinimum', 'prix_minimum'],
  ['prixMaximum', 'prix_maximum'],
  
  // Taux and numeric fields
  ['tauxPourcentage', 'taux_pourcentage'],
  ['tauxRecurrence', 'taux_recurrence'],
  ['tauxReprise', 'taux_reprise'],
  ['tauxTva', 'taux_tva'],
  ['tauxRemise', 'taux_remise'],
  ['recurrenceActive', 'recurrence_active'],
  ['dureeRecurrenceMois', 'duree_recurrence_mois'],
  ['dureeReprisesMois', 'duree_reprises_mois'],
  ['dureeMois', 'duree_mois'],
  ['seuilMin', 'seuil_min'],
  ['seuilMax', 'seuil_max'],
  
  // Repartition fields
  ['profilRemuneration', 'profil_remuneration'],
  ['canalVente', 'canal_vente'],
  ['repartitionCommercial', 'repartition_commercial'],
  ['repartitionManager', 'repartition_manager'],
  ['repartitionAgence', 'repartition_agence'],
  ['repartitionEntreprise', 'repartition_entreprise'],
  
  // Boolean/other fields
  ['actifOnly', 'actif_only'],
  ['includeInactive', 'include_inactive'],
  ['breakingChanges', 'breaking_changes'],
  ['remiseAdditionnelle', 'remise_additionnelle'],
  ['pdfUrl', 'pdf_url'],
  ['fichierUrl', 'fichier_url'],
  ['codePostal', 'code_postal'],
  ['numContrat', 'num_contrat'],
  ['totalItems', 'total_items'],
  ['totalPages', 'total_pages'],
  ['estActif', 'est_actif'],
  ['motifChangement', 'motif_changement'],
  ['ancienStatutId', 'ancien_statut_id'],
  ['nouveauStatutId', 'nouveau_statut_id'],
  ['changedBy', 'changed_by'],
  ['withHistorique', 'with_historique'],
];

// In controllers, these variable names hold proto types
const controllerProtoVars = ['req', 'data', 'request', 'updateData', 'c'];

function processControllerFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const varName of controllerProtoVars) {
    for (const [camelCase, snakeCase] of protoProps) {
      // Replace varName.camelCase with varName.snake_case
      const regex = new RegExp(`${varName}\\.${camelCase}(?![a-zA-Z])`, 'g');
      content = content.replace(regex, `${varName}.${snakeCase}`);
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed controller: ${path.basename(filePath)}`);
    return true;
  }
  return false;
}

function walkDir(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += walkDir(filePath);
    } else if (file.endsWith('.controller.ts')) {
      if (processControllerFile(filePath)) {
        count++;
      }
    }
  }
  
  return count;
}

const srcPath = path.join(__dirname, 'src', 'modules');
console.log('Fixing controller files only in:', srcPath);
console.log('');

const fixedCount = walkDir(srcPath);

console.log(`\nTotal controllers fixed: ${fixedCount}`);
