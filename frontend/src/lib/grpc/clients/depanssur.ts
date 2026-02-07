/**
 * Depanssur gRPC Client
 */

import { grpcClient } from './config';

export const depanssurClient = {
  // Abonnements
  async createAbonnement(request: any) {
    return grpcClient.depanssur.DepanssurService.CreateAbonnement(request);
  },

  async getAbonnement(request: { id: string; organisationId: string }) {
    return grpcClient.depanssur.DepanssurService.GetAbonnement(request);
  },

  async getAbonnementByClient(request: { clientId: string; organisationId: string }) {
    return grpcClient.depanssur.DepanssurService.GetAbonnementByClient(request);
  },

  async updateAbonnement(request: any) {
    return grpcClient.depanssur.DepanssurService.UpdateAbonnement(request);
  },

  async listAbonnements(request: any) {
    return grpcClient.depanssur.DepanssurService.ListAbonnements(request);
  },

  // Dossiers
  async createDossier(request: any) {
    return grpcClient.depanssur.DepanssurService.CreateDossier(request);
  },

  async getDossier(request: { id: string; organisationId: string }) {
    return grpcClient.depanssur.DepanssurService.GetDossier(request);
  },

  async getDossierByReference(request: { referenceExterne: string; organisationId: string }) {
    return grpcClient.depanssur.DepanssurService.GetDossierByReference(request);
  },

  async updateDossier(request: any) {
    return grpcClient.depanssur.DepanssurService.UpdateDossier(request);
  },

  async listDossiers(request: any) {
    return grpcClient.depanssur.DepanssurService.ListDossiers(request);
  },

  // Options
  async listOptions(request: { abonnementId: string; organisationId: string }) {
    return grpcClient.depanssur.DepanssurService.ListOptions(request);
  },

  // Compteurs
  async getCurrentCompteur(request: { abonnementId: string; organisationId: string }) {
    return grpcClient.depanssur.DepanssurService.GetCurrentCompteur(request);
  },
};
