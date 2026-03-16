export interface EnergiePartenairePort {
  createRaccordement(data: {
    clientId: string;
    contratId: string;
    adresse?: string;
    pdlPce?: string;
  }): Promise<{ raccordementId: string }>;
  getStatus(raccordementId: string): Promise<{ status: string }>;
  activateSupply(raccordementId: string): Promise<void>;
  suspendSupply(raccordementId: string): Promise<void>;
}

export const PLENITUDE_PORT = 'PLENITUDE_PORT';
export const OHM_PORT = 'OHM_PORT';
