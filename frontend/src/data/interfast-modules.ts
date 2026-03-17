/**
 * InterFast – Modules métier
 *
 * Regroupe les 135 routes InterFast en modules compréhensibles
 * pour un utilisateur CRM non-technique.
 *
 * Chaque module a :
 *  - Un nom FR clair
 *  - Une description courte
 *  - Un nom d'icône Lucide
 *  - Un flag "recommended"
 *  - Une liste de fonctionnalités (label FR + operationIds techniques)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModuleCapability {
  /** Libellé compréhensible (FR) */
  label: string
  /** Détail optionnel affiché en sous-texte */
  detail?: string
  /** operationIds des routes API couvrant cette fonctionnalité */
  operationIds: string[]
}

export interface InterfastModule {
  id: string
  name: string
  description: string
  /** Nom de l'icône Lucide */
  icon: string
  /** Module recommandé par défaut */
  recommended: boolean
  /** Couleur thème (Tailwind) */
  color: string
  capabilities: ModuleCapability[]
}

// ---------------------------------------------------------------------------
// Module definitions
// ---------------------------------------------------------------------------

export const INTERFAST_MODULES: InterfastModule[] = [
  // ── Gestion Clients ──────────────────────────────────────────────────
  {
    id: "clients",
    name: "Gestion Clients",
    description:
      "Synchroniser vos clients avec InterFast : création, modification, recherche et fusion de fiches clients.",
    icon: "Users",
    recommended: true,
    color: "blue",
    capabilities: [
      {
        label: "Rechercher des clients",
        detail: "Recherche par nom, email ou téléphone",
        operationIds: [
          "ClientController_findClient",
          "CRMController_search",
        ],
      },
      {
        label: "Consulter une fiche client",
        operationIds: ["ClientController_getById"],
      },
      {
        label: "Créer un client particulier",
        operationIds: ["ClientController_createParticular"],
      },
      {
        label: "Créer un client professionnel",
        operationIds: ["ClientController_createClientProfessional"],
      },
      {
        label: "Créer un syndic",
        operationIds: ["ClientController_createClientOwnersAssociation"],
      },
      {
        label: "Modifier un client",
        detail: "Particulier, professionnel ou syndic",
        operationIds: [
          "ClientController_updateClientParticular",
          "ClientController_updateClientProfessional",
          "ClientController_updateClientOwnersAssociation",
        ],
      },
      {
        label: "Supprimer un client",
        operationIds: ["ClientController_deleteClient"],
      },
      {
        label: "Convertir le type de client",
        detail: "Particulier ↔ Professionnel",
        operationIds: [
          "ClientController_convertParticularToProfessional",
          "ClientController_convertProfessionalToParticular",
        ],
      },
      {
        label: "Affecter un commercial",
        detail: "Assigner ou retirer un commercial d'un client",
        operationIds: [
          "ClientController_assignToSalesman",
          "ClientController_unsassignSalesman",
        ],
      },
      {
        label: "Fusionner deux clients",
        detail: "Regrouper les doublons en une seule fiche",
        operationIds: ["ClientController_mergeClients"],
      },
      {
        label: "Importer des clients",
        detail: "Import en masse depuis un fichier",
        operationIds: ["ClientController_importClients"],
      },
      {
        label: "Consulter les documents",
        operationIds: ["ClientController_getDocumentsByClientId"],
      },
      {
        label: "Consulter les événements",
        operationIds: ["ClientController_getEvents"],
      },
      {
        label: "Envoyer un email à un client",
        operationIds: ["ClientController_sendEmail"],
      },
      {
        label: "Modifier la configuration client",
        operationIds: ["ClientController_saveClientConfig"],
      },
      {
        label: "Vérifier la conformité e-invoice",
        operationIds: ["ClientController_checkEInvoiceReadiness"],
      },
      {
        label: "Partager un contact avec un utilisateur",
        operationIds: ["ClientController_shareClientToContact"],
      },
    ],
  },

  // ── Contacts ──────────────────────────────────────────────────────────
  {
    id: "contacts",
    name: "Contacts",
    description:
      "Gérer les contacts associés à chaque client : ajout, modification et liaison aux adresses.",
    icon: "Contact",
    recommended: true,
    color: "indigo",
    capabilities: [
      {
        label: "Lister les contacts",
        operationIds: ["ClientController_getAllContact"],
      },
      {
        label: "Ajouter un contact",
        operationIds: ["ContactController_addContact"],
      },
      {
        label: "Modifier un contact",
        operationIds: ["ContactController_updateContact"],
      },
      {
        label: "Supprimer un contact",
        operationIds: ["ContactController_deleteContact"],
      },
      {
        label: "Associer un contact à une adresse",
        operationIds: ["ContactController_associateContactToAddress"],
      },
      {
        label: "Dissocier un contact d'une adresse",
        operationIds: ["ContactController_dissociateContactFromAddress"],
      },
    ],
  },

  // ── Adresses & Sites ──────────────────────────────────────────────────
  {
    id: "addresses",
    name: "Adresses & Sites",
    description:
      "Gérer les adresses, emplacements et sites d'intervention de vos clients.",
    icon: "MapPin",
    recommended: true,
    color: "emerald",
    capabilities: [
      {
        label: "Ajouter une adresse",
        operationIds: ["ClientAddressesController_createAddress"],
      },
      {
        label: "Modifier une adresse",
        operationIds: ["ClientAddressesController_updateAddress"],
      },
      {
        label: "Supprimer une adresse",
        operationIds: ["ClientAddressesController_deleteAddress"],
      },
      {
        label: "Définir l'adresse principale",
        operationIds: ["ClientAddressesController_updatePrimaryAddress"],
      },
      {
        label: "Gérer les emplacements",
        detail: "Ajouter, modifier et lister les emplacements d'une adresse",
        operationIds: [
          "LocationsController_addLocation",
          "LocationsController_getLocations",
          "LocationsController_updateLocation",
          "LocationsController_getLocation",
        ],
      },
      {
        label: "Importer des emplacements",
        operationIds: ["ClientController_importLocations"],
      },
      {
        label: "Importer des sites complets",
        detail: "Sites, adresses, emplacements et équipements",
        operationIds: ["ClientController_importClientSites"],
      },
      {
        label: "Lister les adresses CRM",
        operationIds: ["CRMController_addresses"],
      },
    ],
  },

  // ── Activités & Notes ─────────────────────────────────────────────────
  {
    id: "activities",
    name: "Activités & Notes",
    description:
      "Suivre l'historique d'activité de vos clients : notes, appels, rendez-vous.",
    icon: "MessageSquare",
    recommended: true,
    color: "violet",
    capabilities: [
      {
        label: "Consulter l'historique d'activité",
        operationIds: ["ClientActivityController_getActivities"],
      },
      {
        label: "Ajouter une note",
        operationIds: ["ClientActivityController_createNote"],
      },
      {
        label: "Modifier une note",
        operationIds: ["ClientActivityController_updateNote"],
      },
      {
        label: "Supprimer une note",
        operationIds: ["ClientActivityController_deleteNote"],
      },
    ],
  },

  // ── Relations ─────────────────────────────────────────────────────────
  {
    id: "relations",
    name: "Relations entre clients",
    description:
      "Créer des liens entre clients : sociétés mères/filles, conjoints, partenaires.",
    icon: "Link",
    recommended: false,
    color: "pink",
    capabilities: [
      {
        label: "Voir les clients liés",
        operationIds: ["RelationsController_getAll"],
      },
      {
        label: "Créer une relation",
        operationIds: ["RelationsController_create"],
      },
      {
        label: "Supprimer une relation",
        operationIds: ["RelationsController_delete"],
      },
    ],
  },

  // ── Devis ─────────────────────────────────────────────────────────────
  {
    id: "quotations",
    name: "Devis",
    description:
      "Créer et gérer les devis : suivi du pipeline, envoi par email, transformation en facture.",
    icon: "FileText",
    recommended: true,
    color: "amber",
    capabilities: [
      {
        label: "Lister les devis",
        operationIds: ["QuotationController_findAll"],
      },
      {
        label: "Créer un devis",
        operationIds: ["QuotationController_createQuotation"],
      },
      {
        label: "Consulter un devis",
        operationIds: ["QuotationController_getQuotation"],
      },
      {
        label: "Modifier un devis",
        operationIds: [
          "QuotationController_updateQuotation",
          "QuotationController_partialUpdateQuotation",
        ],
      },
      {
        label: "Dupliquer un devis",
        operationIds: ["QuotationController_copyQuotation"],
      },
      {
        label: "Supprimer un devis",
        operationIds: ["QuotationController_deleteQuotation"],
      },
      {
        label: "Changer le statut d'un devis",
        detail: "Brouillon, envoyé, accepté, refusé…",
        operationIds: [
          "QuotationController_changeQuotationStatus",
          "QuotationController_aggregateQuotationsPerStatus",
        ],
      },
      {
        label: "Télécharger en PDF",
        operationIds: ["QuotationController_visualizeQuotationFileContent"],
      },
      {
        label: "Envoyer par email",
        operationIds: [
          "QuotationController_sendQuotationByEmail",
          "QuotationController_getQuotationEmailHistory",
        ],
      },
      {
        label: "Transformer en facture",
        detail: "Facture solde, acompte, ou avancement",
        operationIds: [
          "QuotationController_convertQuotationToBill",
          "QuotationController_createDepositBillFromQuotation",
          "QuotationController_createGlobalProgressBillFromQuotation",
          "QuotationController_createDetailedProgressBillFromQuotation",
        ],
      },
      {
        label: "Voir les factures liées",
        operationIds: ["QuotationController_getBills"],
      },
      {
        label: "Gérer les avenants",
        detail: "Créer et lister les avenants depuis un devis",
        operationIds: [
          "QuotationController_createAmendmentFromQuotation",
          "QuotationController_getAmendments",
        ],
      },
      {
        label: "Associer à une intervention",
        operationIds: [
          "QuotationController_linkToIntervention",
          "QuotationController_linkToMaintenance",
        ],
      },
      {
        label: "Exporter les lignes en CSV",
        operationIds: ["QuotationController_exportQuotationCsv"],
      },
    ],
  },

  // ── Facturation ───────────────────────────────────────────────────────
  {
    id: "billing",
    name: "Facturation",
    description:
      "Gérer vos factures : création, envoi, suivi des paiements et facturation électronique.",
    icon: "Receipt",
    recommended: true,
    color: "green",
    capabilities: [
      {
        label: "Lister les factures",
        operationIds: ["BillController_findAll"],
      },
      {
        label: "Créer une facture",
        operationIds: ["BillController_createBill"],
      },
      {
        label: "Consulter une facture",
        operationIds: ["BillController_getBill"],
      },
      {
        label: "Modifier une facture",
        operationIds: [
          "BillController_updateBill",
          "BillController_partialUpdateBill",
        ],
      },
      {
        label: "Dupliquer une facture",
        operationIds: ["BillController_copyBill"],
      },
      {
        label: "Supprimer une facture",
        operationIds: ["BillController_deleteBill"],
      },
      {
        label: "Changer le statut",
        operationIds: [
          "BillController_changeBillStatus",
          "BillController_aggregateBillsPerStatus",
        ],
      },
      {
        label: "Enregistrer un paiement",
        operationIds: ["BillController_registerPayment"],
      },
      {
        label: "Supprimer un paiement",
        operationIds: ["BillController_deletePayment"],
      },
      {
        label: "Télécharger en PDF",
        operationIds: ["BillController_visualizeBillFileContent"],
      },
      {
        label: "Aperçu HTML",
        operationIds: ["BillController_visualizeBillHtml"],
      },
      {
        label: "Envoyer par email",
        operationIds: [
          "BillController_sendBillByEmail",
          "BillController_getBillEmailHistory",
        ],
      },
      {
        label: "Facturation électronique (Peppol)",
        detail: "Envoi et vérification du destinataire Peppol",
        operationIds: [
          "BillController_sendToPeppolEndpoint",
          "BillController_checkPeppolRecipientEndpoint",
        ],
      },
      {
        label: "Lier des factures entre elles",
        operationIds: ["BillController_linkBillTo"],
      },
      {
        label: "Catégoriser une facture",
        operationIds: ["BillController_categorizeBill"],
      },
      {
        label: "Format UBL (XML)",
        operationIds: ["BillController_visualizeBillUBL"],
      },
    ],
  },

  // ── Avoirs ────────────────────────────────────────────────────────────
  {
    id: "credits",
    name: "Avoirs",
    description:
      "Gérer les notes de crédit : création, suivi et envoi par email.",
    icon: "BadgeMinus",
    recommended: true,
    color: "red",
    capabilities: [
      {
        label: "Lister les avoirs",
        operationIds: ["CreditController_findAll"],
      },
      {
        label: "Consulter un avoir",
        operationIds: ["CreditController_getCredit"],
      },
      {
        label: "Modifier un avoir",
        operationIds: [
          "CreditController_updateCredit",
          "CreditController_partialUpdateCredit",
        ],
      },
      {
        label: "Supprimer un avoir",
        operationIds: ["CreditController_deleteCredit"],
      },
      {
        label: "Changer le statut",
        operationIds: [
          "CreditController_changeCreditStatus",
          "CreditController_aggregateCreditPerStatus",
          "CreditController_getLastCreditDate",
        ],
      },
      {
        label: "Télécharger en PDF",
        operationIds: ["CreditController_visualizeCreditFileContent"],
      },
      {
        label: "Aperçu HTML",
        operationIds: ["CreditController_visualizeCreditHtml"],
      },
      {
        label: "Envoyer par email",
        operationIds: [
          "CreditController_sendCreditByEmail",
          "CreditController_getCreditEmailHistory",
        ],
      },
      {
        label: "Catégoriser",
        operationIds: ["CreditController_categorizeCredit"],
      },
    ],
  },

  // ── Avenants ──────────────────────────────────────────────────────────
  {
    id: "amendments",
    name: "Avenants",
    description:
      "Créer et gérer les avenants de vos devis : modifications contractuelles avec suivi de statut.",
    icon: "FilePen",
    recommended: false,
    color: "orange",
    capabilities: [
      {
        label: "Lister les avenants",
        operationIds: ["AmendmentController_findAll"],
      },
      {
        label: "Créer un avenant",
        operationIds: ["AmendmentController_createAmendment"],
      },
      {
        label: "Consulter un avenant",
        operationIds: ["AmendmentController_getOne"],
      },
      {
        label: "Modifier un avenant",
        operationIds: [
          "AmendmentController_updateAmendment",
          "AmendmentController_partialUpdateAmendment",
        ],
      },
      {
        label: "Supprimer un avenant",
        operationIds: ["AmendmentController_deleteAmendment"],
      },
      {
        label: "Changer le statut",
        operationIds: ["AmendmentController_changeAmendmentStatus"],
      },
      {
        label: "Télécharger en PDF",
        operationIds: ["AmendmentController_getPdf"],
      },
      {
        label: "Envoyer par email",
        operationIds: [
          "AmendmentController_sendByEmail",
          "AmendmentController_getEmailHistory",
        ],
      },
    ],
  },

  // ── Paiements ─────────────────────────────────────────────────────────
  {
    id: "payments",
    name: "Paiements",
    description:
      "Suivre les encaissements et exporter les écritures comptables.",
    icon: "CreditCard",
    recommended: true,
    color: "teal",
    capabilities: [
      {
        label: "Lister tous les paiements",
        operationIds: ["PaymentController_findAllRegistered"],
      },
      {
        label: "Export simplifié",
        detail: "Liste des paiements au format tableur",
        operationIds: ["PaymentController_exportAsCsv"],
      },
      {
        label: "Export comptable",
        detail: "Écritures comptables pour votre logiciel de compta",
        operationIds: ["PaymentController_exportAccounting"],
      },
    ],
  },

  // ── Exports & Statistiques ────────────────────────────────────────────
  {
    id: "exports",
    name: "Exports & Statistiques",
    description:
      "Exporter vos données de facturation et consulter les statistiques globales.",
    icon: "BarChart3",
    recommended: true,
    color: "sky",
    capabilities: [
      {
        label: "Exporter les devis",
        operationIds: ["ExportController_exportQuotations"],
      },
      {
        label: "Exporter les factures",
        operationIds: ["ExportController_exportBills"],
      },
      {
        label: "Exporter les avoirs",
        operationIds: ["ExportController_exportCredits"],
      },
      {
        label: "Export comptable",
        detail: "Export au format de votre logiciel comptable",
        operationIds: ["ExportController_exportCreditsAccounting"],
      },
      {
        label: "Archives PDF (devis)",
        operationIds: ["ExportController_exportQuotationsAsArchive"],
      },
      {
        label: "Archives PDF (factures)",
        operationIds: ["ExportController_exportBillsAsArchive"],
      },
      {
        label: "Archives PDF (avoirs)",
        operationIds: ["ExportController_exportCreditsAsArchive"],
      },
      {
        label: "Statistiques de facturation",
        detail: "Chiffre d'affaires, répartition, tendances",
        operationIds: ["BillingAuditController_getStats"],
      },
      {
        label: "Résumé de facturation",
        operationIds: ["BillingAuditController_getSummary"],
      },
      {
        label: "Historique d'audit",
        detail: "Traçabilité des modifications sur devis, factures et avoirs",
        operationIds: [
          "BillingAuditController_getQuotationAudit",
          "BillingAuditController_getBillAudit",
          "BillingAuditController_getCreditAudit",
          "BillingAuditController_getAmendmentAudit",
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tous les operationIds d'un module */
export function getModuleOperationIds(mod: InterfastModule): string[] {
  return mod.capabilities.flatMap((cap) => cap.operationIds)
}

/** Tous les operationIds de tous les modules */
export function getAllOperationIds(): string[] {
  return INTERFAST_MODULES.flatMap(getModuleOperationIds)
}

/** Tous les operationIds des modules recommandés */
export function getRecommendedOperationIds(): string[] {
  return INTERFAST_MODULES.filter((m) => m.recommended).flatMap(
    getModuleOperationIds
  )
}

/** Nombre total de fonctionnalités (capabilities) */
export function getTotalCapabilities(): number {
  return INTERFAST_MODULES.reduce(
    (acc, mod) => acc + mod.capabilities.length,
    0
  )
}

/** Vérifie si un module est entièrement activé */
export function isModuleFullyEnabled(
  mod: InterfastModule,
  enabledRoutes: Set<string>
): boolean {
  const ids = getModuleOperationIds(mod)
  return ids.length > 0 && ids.every((id) => enabledRoutes.has(id))
}

/** Vérifie si un module est partiellement activé */
export function isModulePartiallyEnabled(
  mod: InterfastModule,
  enabledRoutes: Set<string>
): boolean {
  const ids = getModuleOperationIds(mod)
  return (
    ids.some((id) => enabledRoutes.has(id)) &&
    !ids.every((id) => enabledRoutes.has(id))
  )
}

/** Compte les capabilities activées dans un module */
export function getModuleEnabledCount(
  mod: InterfastModule,
  enabledRoutes: Set<string>
): number {
  return mod.capabilities.filter((cap) =>
    cap.operationIds.some((id) => enabledRoutes.has(id))
  ).length
}

/** Couleurs Tailwind par nom de couleur */
export function getModuleColorClasses(color: string) {
  const map: Record<
    string,
    { icon: string; bg: string; border: string; badge: string }
  > = {
    blue: {
      icon: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    indigo: {
      icon: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      border: "border-indigo-200 dark:border-indigo-800",
      badge:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
    },
    emerald: {
      icon: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      badge:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    },
    violet: {
      icon: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      border: "border-violet-200 dark:border-violet-800",
      badge:
        "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    },
    pink: {
      icon: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-50 dark:bg-pink-950/30",
      border: "border-pink-200 dark:border-pink-800",
      badge: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    },
    amber: {
      icon: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    },
    green: {
      icon: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      badge:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    red: {
      icon: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
    orange: {
      icon: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200 dark:border-orange-800",
      badge:
        "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    },
    teal: {
      icon: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/30",
      border: "border-teal-200 dark:border-teal-800",
      badge: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
    },
    sky: {
      icon: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/30",
      border: "border-sky-200 dark:border-sky-800",
      badge: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
    },
  }
  return (
    map[color] ?? {
      icon: "text-muted-foreground",
      bg: "bg-muted/30",
      border: "border-border",
      badge: "bg-muted text-muted-foreground",
    }
  )
}
