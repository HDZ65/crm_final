/**
 * Types et utilitaires pour les formulaires Next.js 15 natifs
 * avec useActionState et validation Zod côté serveur
 */

/**
 * État standardisé retourné par les Server Actions de formulaire
 */
export interface FormState<T = unknown> {
  /** Indique si l'action s'est terminée avec succès */
  success: boolean
  /** Message optionnel (succès ou erreur générale) */
  message?: string
  /** Données retournées en cas de succès */
  data?: T
  /** Erreurs de validation par champ + erreurs globales (_form) */
  errors?: {
    [key: string]: string[]
  } & {
    _form?: string[]
  }
}

/**
 * État initial pour useActionState (version typée)
 */
export function getInitialFormState<T = unknown>(): FormState<T> {
  return { success: false }
}

/**
 * État initial générique pour useActionState
 * Utiliser avec: useActionState(action, initialFormState as FormState<MonType>)
 */
export const initialFormState: FormState<unknown> = {
  success: false,
}

/**
 * Type pour la signature des Server Actions de formulaire
 */
export type FormAction<T = unknown> = (
  prevState: FormState<T>,
  formData: FormData
) => Promise<FormState<T>>
