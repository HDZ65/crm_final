/**
 * Utilitaires de validation pour formulaires Next.js 15 natifs
 * avec Zod côté serveur
 */

import { z, ZodSchema, ZodError } from "zod"
import type { FormState, FormAction } from "./state"

/**
 * Résultat du parsing de FormData
 */
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: FormState["errors"] }

/**
 * Parse et valide FormData avec un schéma Zod
 *
 * @example
 * const result = parseFormData(schema, formData)
 * if (!result.success) {
 *   return { success: false, errors: result.errors }
 * }
 * // result.data est typé selon le schéma
 */
export function parseFormData<T extends ZodSchema>(
  schema: T,
  formData: FormData
): ParseResult<z.infer<T>> {
  const rawData: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    // Ignorer les champs internes Next.js
    if (key.startsWith("$ACTION_")) continue

    // Gérer les tableaux (plusieurs valeurs avec la même clé)
    if (rawData[key] !== undefined) {
      if (Array.isArray(rawData[key])) {
        ;(rawData[key] as unknown[]).push(value)
      } else {
        rawData[key] = [rawData[key], value]
      }
    } else {
      // Convertir les chaînes vides en undefined pour les champs optionnels
      rawData[key] = value === "" ? undefined : value
    }
  }

  try {
    const data = schema.parse(rawData)
    return { success: true, data }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: FormState["errors"] = {}
      for (const issue of error.issues) {
        const path = issue.path.join(".") || "_form"
        if (!errors[path]) errors[path] = []
        errors[path]!.push(issue.message)
      }
      return { success: false, errors }
    }
    return {
      success: false,
      errors: { _form: ["Erreur de validation"] },
    }
  }
}

/**
 * Type pour le handler interne des actions
 */
type ActionHandler<TInput, TResult> = (
  data: TInput
) => Promise<{ data: TResult | null; error: string | null }>

/**
 * Crée une Server Action avec validation Zod intégrée
 */
export function createFormAction<TSchema extends ZodSchema, TResult>(
  schema: TSchema,
  handler: ActionHandler<z.infer<TSchema>, TResult>
): FormAction<TResult> {
  return async (prevState, formData) => {
    const parseResult = parseFormData(schema, formData)

    if (!parseResult.success) {
      return {
        success: false,
        errors: parseResult.errors,
      }
    }

    try {
      const result = await handler(parseResult.data)

      if (result.error) {
        return {
          success: false,
          errors: { _form: [result.error] },
        }
      }

      return {
        success: true,
        data: result.data ?? undefined,
      }
    } catch (error) {
      console.error("[createFormAction] Unexpected error:", error)
      return {
        success: false,
        errors: {
          _form: [
            error instanceof Error
              ? error.message
              : "Une erreur inattendue s'est produite",
          ],
        },
      }
    }
  }
}

/**
 * Préprocesseurs Zod pour transformer les valeurs FormData (strings) en types appropriés
 */
export const formDataTransformers = {
  /**
   * Transforme une string en number (undefined si vide ou invalide)
   */
  number: (val: unknown): number | undefined => {
    if (val === "" || val === undefined || val === null) return undefined
    const num = Number(val)
    return isNaN(num) ? undefined : num
  },

  /**
   * Transforme "true", "on", "1" en true, le reste en false
   */
  boolean: (val: unknown): boolean => {
    return val === "true" || val === "on" || val === "1"
  },

  /**
   * Transforme une string ISO en Date (undefined si vide ou invalide)
   */
  date: (val: unknown): Date | undefined => {
    if (!val || val === "") return undefined
    const date = new Date(String(val))
    return isNaN(date.getTime()) ? undefined : date
  },

  /**
   * Retourne undefined si la chaîne est vide
   */
  optionalString: (val: unknown): string | undefined => {
    if (val === "" || val === undefined || val === null) return undefined
    return String(val)
  },

  /**
   * Transforme une string en tableau (split par virgule)
   */
  array: (val: unknown): string[] => {
    if (!val || val === "") return []
    if (Array.isArray(val)) return val.map(String)
    return String(val)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  },
}

/**
 * Helper pour créer un schéma Zod avec transformations FormData courantes
 * Note: Utilise l'API Zod 4 avec { message } au lieu de { required_error }
 */
export const formDataSchema = {
  /**
   * String requis (transforme undefined/"" en erreur)
   */
  requiredString: (message = "Ce champ est requis") =>
    z
      .string({ message })
      .min(1, message),

  /**
   * String optionnel (transforme "" en undefined)
   */
  optionalString: () =>
    z.preprocess(formDataTransformers.optionalString, z.string().optional()),

  /**
   * Email requis
   */
  email: (message = "Email invalide") => z.string().email(message),

  /**
   * Email optionnel
   */
  optionalEmail: (message = "Email invalide") =>
    z.preprocess(
      formDataTransformers.optionalString,
      z.string().email(message).optional()
    ),

  /**
   * Number requis
   */
  requiredNumber: (message = "Ce champ est requis") =>
    z.preprocess(formDataTransformers.number, z.number({ message })),

  /**
   * Number optionnel
   */
  optionalNumber: () =>
    z.preprocess(formDataTransformers.number, z.number().optional()),

  /**
   * Boolean (checkbox)
   */
  boolean: () => z.preprocess(formDataTransformers.boolean, z.boolean()),

  /**
   * Date requise
   */
  requiredDate: (message = "Date invalide") =>
    z.preprocess(formDataTransformers.date, z.date({ message })),

  /**
   * Date optionnelle
   */
  optionalDate: () =>
    z.preprocess(formDataTransformers.date, z.date().optional()),

  /**
   * UUID requis
   */
  uuid: (message = "ID invalide") => z.string().uuid(message),

  /**
   * UUID optionnel
   */
  optionalUuid: () =>
    z.preprocess(
      formDataTransformers.optionalString,
      z.string().uuid().optional()
    ),
}
