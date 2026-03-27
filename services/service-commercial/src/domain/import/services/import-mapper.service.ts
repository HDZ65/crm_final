import { Injectable } from '@nestjs/common';

export interface ExternalCommercialPayload {
  id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalContratPayload {
  id?: number | string;
  idContrat?: number | string;
  titre?: string;
  description?: string;
  type?: string;
  statut?: string;
  dateDebut?: string;
  date_debut?: string;
  dateFin?: string;
  date_fin?: string;
  dateSignature?: string;
  date_signature?: string;
  montant?: number;
  devise?: string;
  frequenceFacturation?: string;
  frequence_facturation?: string;
  documentUrl?: string;
  document_url?: string;
  fournisseur?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalOffrePayload {
  id?: number | string;
  offreId?: number | string;
  nom?: string;
  categorie?: string;
  description?: string;
  prix?: number;
  totalAmount?: number;
  devise?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalSouscriptionPayload {
  idSouscription?: number | string;
  offreId?: number | string;
  totalAmount?: number;
  amount?: number;
  devise?: string;
  statut?: string;
  frequency?: string;
  dateDebut?: string;
  dateFin?: string;
  nextChargeAt?: string;
  created_at?: string;
  updated_at?: string;
  offre?: ExternalOffrePayload;
  contrats?: ExternalContratPayload[];
}

export interface ExternalPaymentPayload {
  idInfoPaiement?: number | string;
  IBAN?: string;
  BIC?: string;
  titulaireCompte?: string;
  mandatSepaReference?: string;
  dateMandat?: string;
  statut?: string;
  commentaire?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExternalProspectPayload {
  idProspect?: number | string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  date_naissance?: string;
  commercialId?: string;
  commercial?: ExternalCommercialPayload;
  Souscription?: ExternalSouscriptionPayload[];
  informationsPaiement?: ExternalPaymentPayload[];
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class ImportMapperService {
  mapProspectToClientBase(prospect: ExternalProspectPayload): {
    type_client: string;
    nom: string;
    prenom: string;
    date_naissance: string;
    compte_code: string;
    partenaire_id: string;
    telephone: string;
    email: string;
    statut: string;
    canal_acquisition: string;
  } {
    const externalId = this.toExternalId(prospect.idProspect, 'prospect');

    return {
      type_client: 'PARTICULIER',
      nom: (prospect.nom || '').trim() || 'INCONNU',
      prenom: (prospect.prenom || '').trim() || 'INCONNU',
      date_naissance: prospect.date_naissance || '',
      compte_code: `EXT-${externalId}`,
      partenaire_id: '',
      telephone: prospect.telephone || '',
      email: prospect.email || '',
      statut: 'ACTIF',
      canal_acquisition: `legacy:${externalId}`,
    };
  }

  mapCommercialToApporteur(commercial: ExternalCommercialPayload): {
    utilisateurId: string | null;
    nom: string;
    prenom: string;
    typeApporteur: string;
    email: string | null;
    telephone: string | null;
    actif: boolean;
  } {
    return {
      utilisateurId: commercial.id || null,
      nom: (commercial.nom || '').trim() || 'INCONNU',
      prenom: (commercial.prenom || '').trim() || 'INCONNU',
      typeApporteur: 'COMMERCIAL',
      email: commercial.email || null,
      telephone: commercial.telephone || null,
      actif: true,
    };
  }

  mapOffreToProduitInput(offre: ExternalOffrePayload): {
    externalId: string;
    sku: string;
    nom: string;
    description?: string;
    categorie: number;
    type: number;
    statut_cycle: number;
    prix: number;
    taux_tva: number;
    devise: string;
    code_externe: string;
    metadata: string;
  } {
    const externalId = this.toExternalId(offre.offreId ?? offre.id, 'offre');

    return {
      externalId,
      sku: `OFFRE-${externalId}`,
      nom: (offre.nom || '').trim() || `Offre ${externalId}`,
      description: offre.description,
      categorie: this.mapCategorieToProto(offre.categorie),
      type: 1,
      statut_cycle: 3,
      prix: Number(offre.prix ?? offre.totalAmount ?? 0),
      taux_tva: 20,
      devise: offre.devise || 'EUR',
      code_externe: externalId,
      metadata: JSON.stringify({
        external_id: externalId,
      }),
    };
  }

  mapContratToContratInput(
    contrat: ExternalContratPayload,
    clientId: string,
    commercialId: string,
  ): {
    externalId: string;
    reference: string;
    titre?: string;
    description?: string;
    type?: string;
    statut: string;
    dateDebut: string;
    dateFin?: string;
    dateSignature?: string;
    montant?: number;
    devise: string;
    frequenceFacturation?: string;
    documentUrl?: string;
    fournisseur?: string;
    notes?: string;
    clientId: string;
    commercialId: string;
  } {
    const externalId = this.toExternalId(contrat.idContrat ?? contrat.id, 'contrat');

    return {
      externalId,
      reference: `EXT-CONTRAT-${externalId}`,
      titre: contrat.titre,
      description: contrat.description,
      type: contrat.type,
      statut: contrat.statut || 'ACTIF',
      dateDebut: contrat.dateDebut || contrat.date_debut || new Date().toISOString(),
      dateFin: contrat.dateFin || contrat.date_fin,
      dateSignature: contrat.dateSignature || contrat.date_signature,
      montant: contrat.montant,
      devise: contrat.devise || 'EUR',
      frequenceFacturation: contrat.frequenceFacturation || contrat.frequence_facturation,
      documentUrl: contrat.documentUrl || contrat.document_url,
      fournisseur: contrat.fournisseur,
      notes: contrat.notes,
      clientId,
      commercialId,
    };
  }

  mapSouscriptionToSubscriptionInput(
    souscription: ExternalSouscriptionPayload,
    clientId: string,
    contratId: string | null,
  ): {
    externalId: string;
    clientId: string;
    contratId: string | null;
    status: string;
    frequency: string;
    amount: number;
    currency: string;
    startDate: string;
    endDate?: string;
    nextChargeAt: string;
    planType: string;
    storeSource: string;
    imsSubscriptionId: string;
  } {
    const externalId = this.toExternalId(souscription.idSouscription, 'souscription');
    const startDate = souscription.dateDebut || souscription.created_at || new Date().toISOString();
    const endDate = souscription.dateFin;

    return {
      externalId,
      clientId,
      contratId,
      status: this.normalizeSubscriptionStatus(souscription.statut),
      frequency: this.normalizeFrequency(souscription.frequency),
      amount: Number(souscription.totalAmount ?? souscription.amount ?? 0),
      currency: souscription.devise || 'EUR',
      startDate,
      endDate,
      nextChargeAt: souscription.nextChargeAt || endDate || startDate,
      planType: 'PREMIUM_SVOD',
      storeSource: 'WEB_DIRECT',
      imsSubscriptionId: externalId,
    };
  }

  mapPaymentToFinanceUpsert(
    payment: ExternalPaymentPayload,
    clientId: string,
    updatedAt?: string,
  ): {
    external_id: string;
    client_id: string;
    iban: string;
    bic: string;
    titulaire_compte?: string;
    mandat_sepa_reference?: string;
    date_mandat?: string;
    statut?: string;
    commentaire?: string;
    updated_at?: string;
  } {
    const externalId = this.toExternalId(payment.idInfoPaiement, 'payment');

    return {
      external_id: externalId,
      client_id: clientId,
      iban: (payment.IBAN || '').trim(),
      bic: (payment.BIC || '').trim(),
      titulaire_compte: payment.titulaireCompte,
      mandat_sepa_reference: payment.mandatSepaReference,
      date_mandat: payment.dateMandat,
      statut: payment.statut,
      commentaire: payment.commentaire,
      updated_at: updatedAt,
    };
  }

  resolveCommercialPayload(prospect: ExternalProspectPayload): ExternalCommercialPayload {
    const nested = prospect.commercial || {};
    return {
      id: nested.id || prospect.commercialId,
      nom: nested.nom,
      prenom: nested.prenom,
      email: nested.email,
      telephone: nested.telephone,
      created_at: nested.created_at,
      updated_at: nested.updated_at,
    };
  }

  toExternalId(value: number | string | undefined, fallbackPrefix: string): string {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
    return `${fallbackPrefix}-${Date.now()}`;
  }

  private mapCategorieToProto(value?: string): number {
    const normalized = String(value || '').trim().toUpperCase();
    switch (normalized) {
      case 'ASSURANCE':
        return 1;
      case 'PREVOYANCE':
        return 2;
      case 'EPARGNE':
        return 3;
      case 'ACCESSOIRE':
        return 5;
      default:
        return 4;
    }
  }

  private normalizeSubscriptionStatus(value?: string): string {
    const normalized = String(value || '').trim().toUpperCase();
    switch (normalized) {
      case 'VALIDE':
      case 'VALIDEE':
      case 'ACTIVE':
        return 'ACTIVE';
      case 'EN_ATTENTE':
      case 'PENDING':
        return 'PENDING';
      case 'SUSPENDU':
      case 'SUSPENDED':
        return 'SUSPENDED';
      case 'CANCELLED':
      case 'CANCELED':
      case 'ANNULE':
        return 'CANCELLED';
      default:
        return 'ACTIVE';
    }
  }

  private normalizeFrequency(value?: string): string {
    const normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'ANNUAL' || normalized === 'YEARLY') {
      return 'ANNUAL';
    }
    return 'MONTHLY';
  }
}
