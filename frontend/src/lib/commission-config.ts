/**
 * Configuration statique des commissions
 * Ces valeurs sont utilisées pour les dropdowns et affichages
 */

export interface TypeOption {
  value: string
  label: string
  description?: string
  color?: string
}

export interface DureeOption {
  value: number
  label: string
}

export interface CommissionConfig {
  typesApporteur: TypeOption[]
  typesProduit: TypeOption[]
  typesReprise: TypeOption[]
  typesCalcul: TypeOption[]
  typesBase: TypeOption[]
  typesPalier: TypeOption[]
  statutsReprise: TypeOption[]
  statutsBordereau: TypeOption[]
  typesLigne: TypeOption[]
  statutsLigne: TypeOption[]
  dureesReprise: DureeOption[]
}

export const commissionConfig: CommissionConfig = {
  typesApporteur: [
    { value: "vrp", label: "VRP", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { value: "manager", label: "Manager", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    { value: "directeur", label: "Directeur", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    { value: "partenaire", label: "Partenaire", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" },
  ],
  typesProduit: [
    { value: "telecom", label: "Télécom", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
    { value: "assurance_sante", label: "Assurance Santé", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    { value: "prevoyance", label: "Prévoyance", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    { value: "energie", label: "Énergie", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    { value: "conciergerie", label: "Conciergerie", color: "bg-pink-500/10 text-pink-600 border-pink-500/20" },
    { value: "mondial_tv", label: "Mondial TV", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    { value: "autre", label: "Autre", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  ],
  typesReprise: [
    { value: "resiliation", label: "Résiliation", description: "Le contrat a été résilié" },
    { value: "impaye", label: "Impayé", description: "Impayés constatés sur le contrat" },
    { value: "annulation", label: "Annulation", description: "Le contrat a été annulé" },
    { value: "regularisation", label: "Régularisation", description: "Régularisation comptable" },
  ],
  typesCalcul: [
    { value: "fixe", label: "Montant Fixe", description: "Montant fixe par contrat" },
    { value: "pourcentage", label: "Pourcentage", description: "Pourcentage de la base de calcul" },
    { value: "palier", label: "Palier", description: "Montant selon seuils atteints" },
    { value: "mixte", label: "Mixte", description: "Fixe + pourcentage combinés" },
  ],
  typesBase: [
    { value: "cotisation_ht", label: "Cotisation HT", description: "Base sur la cotisation HT" },
    { value: "ca_ht", label: "CA HT", description: "Base sur le chiffre d'affaires HT" },
    { value: "forfait", label: "Forfait", description: "Base forfaitaire" },
  ],
  typesPalier: [
    { value: "volume", label: "Volume", description: "Palier basé sur le volume" },
    { value: "ca", label: "Chiffre d'affaires", description: "Palier basé sur le CA" },
    { value: "prime_produit", label: "Prime produit", description: "Prime par produit vendu" },
  ],
  statutsReprise: [
    { value: "en_attente", label: "En attente", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    { value: "appliquee", label: "Appliquée", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    { value: "annulee", label: "Annulée", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  ],
  statutsBordereau: [
    { value: "brouillon", label: "Brouillon", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
    { value: "valide", label: "Validé", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    { value: "exporte", label: "Exporté", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { value: "archive", label: "Archivé", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  ],
  typesLigne: [
    { value: "commission", label: "Commission" },
    { value: "reprise", label: "Reprise" },
    { value: "acompte", label: "Acompte" },
    { value: "prime", label: "Prime" },
    { value: "regularisation", label: "Régularisation" },
  ],
  statutsLigne: [
    { value: "selectionnee", label: "Sélectionnée" },
    { value: "deselectionnee", label: "Désélectionnée" },
    { value: "validee", label: "Validée" },
    { value: "rejetee", label: "Rejetée" },
  ],
  dureesReprise: [
    { value: 3, label: "3 mois" },
    { value: 6, label: "6 mois" },
    { value: 12, label: "12 mois" },
  ],
}
