import { z } from "zod";

/**
 * Schéma de validation pour la création d'un consentement RGPD
 */
export const createConsentementSchema = z.object({
  clientBaseId: z.string().min(1, "Client requis"),
  type: z.enum(["RGPD_EMAIL", "RGPD_SMS", "CGS_DEPANSSUR"], {
    error: "Type de consentement invalide",
  }),
  accorde: z.boolean(),
  dateAccord: z.string().min(1, "Date d'accord requise"),
  source: z.string().min(1, "Source requise"),
});

export type CreateConsentementFormData = z.infer<typeof createConsentementSchema>;

/**
 * Schéma de validation pour la mise à jour d'un consentement RGPD
 */
export const updateConsentementSchema = z.object({
  id: z.string().min(1, "ID consentement requis"),
  accorde: z.boolean().optional(),
  dateRetrait: z.string().optional(),
  source: z.string().optional(),
});

export type UpdateConsentementFormData = z.infer<typeof updateConsentementSchema>;

/**
 * Schéma de validation pour récupérer un consentement
 */
export const getConsentementSchema = z.object({
  id: z.string().min(1, "ID consentement requis"),
});

export type GetConsentementFormData = z.infer<typeof getConsentementSchema>;

/**
 * Schéma de validation pour lister les consentements d'un client
 */
export const listConsentementsSchema = z.object({
  clientBaseId: z.string().min(1, "Client requis"),
  type: z.enum(["RGPD_EMAIL", "RGPD_SMS", "CGS_DEPANSSUR"]).optional(),
});

export type ListConsentementsFormData = z.infer<typeof listConsentementsSchema>;

/**
 * Schéma de validation pour supprimer un consentement
 */
export const deleteConsentementSchema = z.object({
  id: z.string().min(1, "ID consentement requis"),
});

export type DeleteConsentementFormData = z.infer<typeof deleteConsentementSchema>;
