import { z } from "zod";
import { formDataTransformers } from "@/lib/form-validation";

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
});

export type UpdateClientFormData = z.infer<typeof updateClientSchema>;
