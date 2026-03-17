import { z } from "zod";
import { formDataTransformers } from "@/lib/forms/validation";

/**
 * Schéma de validation pour le formulaire de création de client
 */
export const createClientSchema = z.object({
  organisationId: z.string().min(1, "Organisation requise"),
  typeClient: z.string().min(1, "Le type de client est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  dateNaissance: z.preprocess(
    formDataTransformers.optionalString,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format YYYY-MM-DD requise").optional()
  ),
  telephone: z.string().min(1, "Le téléphone est requis"),
  email: z.preprocess(
    formDataTransformers.optionalString,
    z.string().email("Email invalide").optional()
  ),
  statutId: z.string().min(1, "Le statut est requis"),
  societeId: z.preprocess(
    formDataTransformers.optionalString,
    z.string().uuid("ID société invalide").optional()
  ),
  iban: z.preprocess(
    formDataTransformers.optionalString,
    z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/, "IBAN invalide (format ISO 13616)").optional()
  ),
  bic: z.preprocess(
    formDataTransformers.optionalString,
    z.string().regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "BIC invalide").optional()
  ),
  civilite: z.string().optional(),
  csp: z.string().max(100).optional(),
  lieuNaissance: z.string().max(100).optional(),
  paysNaissance: z.string().max(100).optional(),
  regimeSocial: z.string().max(100).optional(),
  numss: z.string().max(20).optional(),
  canalAcquisition: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
});

export type CreateClientFormData = z.infer<typeof createClientSchema>;

/**
 * Schéma de validation pour le formulaire de mise à jour de client
 */
export const updateClientSchema = z.object({
  id: z.string().min(1, "ID client requis"),
  typeClient: z.string().optional(),
  nom: z.string().min(1, "Le nom est requis").optional(),
  prenom: z.string().min(1, "Le prénom est requis").optional(),
  dateNaissance: z.preprocess(
    formDataTransformers.optionalString,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format YYYY-MM-DD requise").optional()
  ),
  telephone: z.string().optional(),
  email: z.preprocess(
    formDataTransformers.optionalString,
    z.string().email("Email invalide").optional()
  ),
  statutId: z.string().optional(),
  societeId: z.preprocess(
    formDataTransformers.optionalString,
    z.string().uuid("ID société invalide").optional().nullable()
  ),
  iban: z.preprocess(
    formDataTransformers.optionalString,
    z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/, "IBAN invalide (format ISO 13616)").optional()
  ),
  bic: z.preprocess(
    formDataTransformers.optionalString,
    z.string().regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "BIC invalide").optional()
  ),
  civilite: z.string().optional(),
  csp: z.string().max(100).optional(),
  lieuNaissance: z.string().max(100).optional(),
  paysNaissance: z.string().max(100).optional(),
  regimeSocial: z.string().max(100).optional(),
  numss: z.string().max(20).optional(),
  canalAcquisition: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
});

export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
