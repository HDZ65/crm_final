import { z } from "zod";

/**
 * Schéma de validation pour le formulaire de connexion
 */
export const loginSchema = z.object({
  email: z
    .string({ message: "L'email est requis" })
    .min(1, "L'email est requis")
    .email("Email invalide"),
  password: z
    .string({ message: "Le mot de passe est requis" })
    .min(1, "Le mot de passe est requis"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schéma de validation pour le formulaire d'inscription
 */
export const signupSchema = z.object({
  nom: z
    .string({ message: "Le nom est requis" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z
    .string({ message: "Le prénom est requis" })
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z
    .string({ message: "L'email est requis" })
    .email("Email invalide"),
  password: z
    .string({ message: "Le mot de passe est requis" })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export type SignupFormData = z.infer<typeof signupSchema>;
