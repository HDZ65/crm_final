import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface WinLeadPlusPaymentInfo {
  iban?: string;
  IBAN?: string;
  BIC?: string;
  bic?: string;
  mandatSepa?: boolean;
  mandat_sepa?: boolean;
}

export interface WinLeadPlusAbonnement {
  offreId?: number | string;
  nom?: string;
  categorie?: string;
  prix_base?: number | string;
  prixBase?: number | string;
}

export interface WinLeadPlusContrat {
  id?: number | string;
  idContrat?: number | string;
  titre?: string;
  statut?: string;
  montant?: number | string;
  dateSignature?: string;
  date_signature?: string;
  devise?: string;
  frequenceFacturation?: string;
  frequence_facturation?: string;
  commercialId?: string;
  notes?: string;
}

export interface WinLeadPlusSouscription {
  idSouscription?: number | string;
  offreId?: number | string;
  totalAmount?: number | string;
  dateSouscription?: string;
  offre?: WinLeadPlusAbonnement & {
    fournisseur?: string;
    logo_url?: string;
    nom?: string;
    categorie?: string;
    prix_base?: number | string;
  };
  contrats?: WinLeadPlusContrat[];
}

export interface WinLeadPlusProspect {
  idProspect?: number | string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  adresse1?: string;
  ville?: string;
  codePostal?: string;
  code_postal?: string;
  pays?: string;
  date_naissance?: string;
  dateNaissance?: string;
  adressePostaleLigne1?: string;
  adressePostaleLigne2?: string;
  streetnumber?: string;
  civilite?: string;
  csp?: string;
  regimeSocial?: string;
  etapeCourante?: string;
  statutProspect?: string;
  lieuNaissance?: string;
  paysNaissance?: string;
  codePostalNaissance?: string;
  numss?: string;
  numorganisme?: string;
  is_politically_exposed?: boolean;
  consentementRGPDTraitementDonnees?: boolean;
  consentementRGPDCommunicationsCommerciales?: boolean;
  Souscription?: WinLeadPlusSouscription[];
  commercial?: {
    id?: string;
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
  };
  parentProspectId?: number | string;
  createdAt?: string;
  commercialId?: string;
  contrats?: WinLeadPlusContrat[];
  abonnements?: WinLeadPlusAbonnement[];
  informationsPaiement?: WinLeadPlusPaymentInfo[];
}

export interface WinLeadPlusMappedClient {
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
  source: string;
  commercial_id: string;
  iban?: string;
  mandat_sepa?: boolean;
  adresse?: {
    ligne1: string;
    ligne2: string;
    code_postal: string;
    ville: string;
    pays: string;
    type: string;
  };
  civilite?: string;
  bic?: string;
  csp?: string;
  regime_social?: string;
  lieu_naissance?: string;
  pays_naissance?: string;
  etape_courante?: string;
  is_politically_exposed?: boolean;
  numss?: string;
}

export interface WinLeadPlusMappedContrat {
  reference: string;
  titre?: string;
  statut: string;
  montant?: number;
  dateSignature?: string;
  dateDebut: string;
  devise: string;
  frequenceFacturation?: string;
  fournisseur: string;
  clientId: string;
  commercialId: string;
  notes?: string;
  source: string;
}

export interface WinLeadPlusMappedLigneContrat {
  contratId: string;
  nom: string;
  prix_unitaire: number;
  quantite: number;
  metadata: {
    source: string;
    categorie: string;
    offre_id: string;
  };
}

const WINLEADPLUS_SOURCE = 'WinLeadPlus';

@Injectable()
export class WinLeadPlusMapperService {
  mapProspectToClient(prospect: WinLeadPlusProspect): WinLeadPlusMappedClient {
    const prospectId = this.toText(prospect.idProspect) || 'unknown';
    const payment = Array.isArray(prospect.informationsPaiement)
      ? prospect.informationsPaiement[0]
      : undefined;

    const iban = this.toText(payment?.iban || payment?.IBAN);
    const bic = this.toText(payment?.BIC || payment?.bic);
    const mandatSepaValue = payment?.mandatSepa ?? payment?.mandat_sepa;
    const adresse = this.toText(prospect.adressePostaleLigne1 || prospect.adresse1 || prospect.adresse);
    const codePostal = this.toText(prospect.codePostal || prospect.code_postal);
    const ville = this.toText(prospect.ville);
    const pays = this.toText(prospect.pays) || 'FR';

    return {
      type_client: 'PARTICULIER',
      nom: this.toText(prospect.nom) || 'INCONNU',
      prenom: this.toText(prospect.prenom) || 'INCONNU',
      date_naissance: this.toText(prospect.dateNaissance || prospect.date_naissance),
      compte_code: `WLP-${prospectId}`,
      partenaire_id: '',
      telephone: this.toText(prospect.telephone),
      email: this.toText(prospect.email),
      statut: 'ACTIF',
      canal_acquisition: `winleadplus:${prospectId}`,
      source: WINLEADPLUS_SOURCE,
      commercial_id: this.toText(prospect.commercialId || prospect.commercial?.id),
      iban: iban || undefined,
      mandat_sepa: typeof mandatSepaValue === 'boolean' ? mandatSepaValue : undefined,
      civilite: this.toText(prospect.civilite) || undefined,
      bic: bic || undefined,
      csp: this.toText(prospect.csp) || undefined,
      regime_social: this.toText(prospect.regimeSocial) || undefined,
      lieu_naissance: this.toText(prospect.lieuNaissance) || undefined,
      pays_naissance: this.toText(prospect.paysNaissance) || undefined,
      etape_courante: this.toText(prospect.etapeCourante) || undefined,
      is_politically_exposed: typeof prospect.is_politically_exposed === 'boolean' ? prospect.is_politically_exposed : undefined,
      numss: this.toText(prospect.numss) || undefined,
      adresse:
        adresse || codePostal || ville
          ? {
              ligne1: adresse,
              ligne2: prospect.adressePostaleLigne2 || '',
              code_postal: codePostal,
              ville,
              pays,
              type: 'PRINCIPALE',
            }
          : undefined,
    };
  }

  mapContratToContrat(contrat: WinLeadPlusContrat, clientId: string): WinLeadPlusMappedContrat {
    const externalId = this.toText(contrat.idContrat ?? contrat.id) || `missing-${Date.now()}`;

    return {
      reference: `WLP-CONTRAT-${externalId}`,
      titre: this.toText(contrat.titre) || `Contrat ${externalId}`,
      statut: this.toText(contrat.statut) || 'ACTIF',
      montant: this.toNumber(contrat.montant),
      dateSignature: this.toText(contrat.dateSignature || contrat.date_signature) || undefined,
      dateDebut: this.toText(contrat.dateSignature || contrat.date_signature) || new Date().toISOString(),
      devise: this.toText(contrat.devise) || 'EUR',
      frequenceFacturation:
        this.toText(contrat.frequenceFacturation || contrat.frequence_facturation) || undefined,
      fournisseur: WINLEADPLUS_SOURCE,
      clientId,
      commercialId: this.toText(contrat.commercialId),
      notes: this.toText(contrat.notes) || undefined,
      source: WINLEADPLUS_SOURCE,
    };
  }

  mapAbonnementToLigneContrat(
    abonnement: WinLeadPlusAbonnement,
    contratId: string,
  ): WinLeadPlusMappedLigneContrat {
    const offreId = this.toText(abonnement.offreId) || 'unknown';

    return {
      contratId,
      nom: this.toText(abonnement.nom) || `Abonnement ${offreId}`,
      prix_unitaire: this.toNumber(abonnement.prix_base ?? abonnement.prixBase),
      quantite: 1,
      metadata: {
        source: WINLEADPLUS_SOURCE,
        categorie: this.toText(abonnement.categorie),
        offre_id: offreId,
      },
    };
  }

  mapSouscriptionContratToContrat(
    contrat: WinLeadPlusContrat,
    souscription: WinLeadPlusSouscription,
    clientId: string,
    commercialId?: string,
  ): WinLeadPlusMappedContrat {
    const externalId = this.toText(contrat.idContrat ?? contrat.id) || `missing-${Date.now()}`;
    const offre = souscription.offre;
    const fournisseur = this.toText(offre?.fournisseur) || WINLEADPLUS_SOURCE;

    return {
      reference: `WLP-CONTRAT-${externalId}`,
      titre: this.toText(contrat.titre) || `Contrat ${externalId}`,
      statut: this.toText(contrat.statut) || 'ACTIF',
      montant: this.toNumber(souscription.totalAmount ?? contrat.montant),
      dateSignature: this.toText(contrat.dateSignature || contrat.date_signature) || undefined,
      dateDebut:
        this.toText(contrat.dateSignature || contrat.date_signature) || new Date().toISOString(),
      devise: this.toText(contrat.devise) || 'EUR',
      frequenceFacturation:
        this.toText(contrat.frequenceFacturation || contrat.frequence_facturation) || undefined,
      fournisseur,
      clientId,
      commercialId: commercialId || this.toText(contrat.commercialId) || '',
      notes: this.toText(contrat.notes) || undefined,
      source: WINLEADPLUS_SOURCE,
    };
  }

  mapSouscriptionOffreToLigneContrat(
    offre: WinLeadPlusSouscription['offre'],
    contratId: string,
  ): WinLeadPlusMappedLigneContrat | null {
    if (!offre) return null;

    const offreId = this.toText(offre.offreId) || 'unknown';

    return {
      contratId,
      nom: this.toText(offre.nom) || `Offre ${offreId}`,
      prix_unitaire: this.toNumber(offre.prix_base ?? offre.prixBase),
      quantite: 1,
      metadata: {
        source: WINLEADPLUS_SOURCE,
        categorie: this.toText(offre.categorie),
        offre_id: offreId,
      },
    };
  }

  computeDataHash(prospect: WinLeadPlusProspect): string {
    const normalized = this.normalizeForHash(prospect);
    return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  }

  private normalizeForHash(input: unknown): unknown {
    if (Array.isArray(input)) {
      return input.map((item) => this.normalizeForHash(item));
    }

    if (input && typeof input === 'object') {
      const source = input as Record<string, unknown>;
      const normalized: Record<string, unknown> = {};
      for (const key of Object.keys(source).sort()) {
        normalized[key] = this.normalizeForHash(source[key]);
      }
      return normalized;
    }

    return input;
  }

  private toText(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return '';
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }
}
