export class ContratDto {
  id: string;
  organisationId: string;
  referenceExterne: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
  statutId: string;
  autoRenouvellement: boolean;
  joursPreavis: number;
  conditionPaiementId: string;
  modeleDistributionId: string;
  facturationParId: string;
  clientBaseId: string;
  societeId: string;
  commercialId: string;
  clientPartenaireId: string;
  adresseFacturationId: string;
  dateFinRetractation: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ContratDto>) {
    Object.assign(this, partial);
  }
}
