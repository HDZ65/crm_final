/**
 * useFormState - Hook ameliore pour la gestion des formulaires
 * 
 * Combine:
 * - React Hook Form (validation)
 * - Error handling
 * - Loading states
 */

import { useState, useCallback } from "react"
import { useForm, FieldValues, Path, FieldError, DefaultValues, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useAppStore } from "@/stores/app-store"
import { translateBackendError, extractValidationErrors } from "@/lib/errors/messages"

// ============================================
// Types
// ============================================

export interface UseFormStateOptions<T extends FieldValues> {
  /** Schema Zod pour la validation */
  schema: z.ZodSchema<T>
  /** Valeurs par defaut */
  defaultValues?: DefaultValues<T>
  /** Mode de validation */
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all"
  /** Cle unique pour le loading state global */
  loadingKey?: string
  /** Message de succes */
  successMessage?: string
  /** Afficher les erreurs via toast */
  showErrorToast?: boolean
}

// ============================================
// Hook
// ============================================

export function useFormState<T extends FieldValues>(options: UseFormStateOptions<T>) {
  const {
    schema,
    defaultValues,
    mode = "onBlur",
    loadingKey,
    successMessage,
    showErrorToast = true,
  } = options

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const setGlobalLoading = useAppStore((state) => state.setLoading)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<T>({
    resolver: zodResolver(schema as any) as any,
    defaultValues,
    mode,
  })

  const applyBackendErrors = useCallback(
    (errors: Record<string, string[]>) => {
      Object.entries(errors).forEach(([field, messages]) => {
        if (field === "_form" || field === "_general") {
          setFormError(messages[0])
        } else {
          form.setError(field as Path<T>, {
            type: "server",
            message: messages[0],
          })
        }
      })
    },
    [form]
  )

  const handleSubmitWithLoading = useCallback(
    (onSubmit: (data: T) => Promise<void>) => {
      return form.handleSubmit(async (data: T) => {
        setIsSubmitting(true)
        setFormError(null)

        if (loadingKey) {
          setGlobalLoading(loadingKey, true)
        }

        try {
          await onSubmit(data)

          if (successMessage) {
            toast.success(successMessage)
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err))
          const translatedMessage = translateBackendError(error.message)

          const validationErrors = extractValidationErrors(err)
          if (validationErrors) {
            applyBackendErrors(validationErrors)
          } else {
            setFormError(translatedMessage)
          }

          if (showErrorToast) {
            toast.error(translatedMessage)
          }

          console.error("[Form Error]", err)
        } finally {
          setIsSubmitting(false)
          if (loadingKey) {
            setGlobalLoading(loadingKey, false)
          }
        }
      })
    },
    [form, loadingKey, successMessage, showErrorToast, setGlobalLoading, applyBackendErrors]
  )

  const resetForm = useCallback(() => {
    form.reset()
    setFormError(null)
    setIsSubmitting(false)
  }, [form])

  return {
    // Spread all react-hook-form methods
    ...form,
    // Additional methods
    handleSubmitWithLoading,
    isSubmitting,
    formError,
    setFormError,
    resetForm,
    applyBackendErrors,
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Extrait le message d'erreur d'un champ
 */
export function getFieldErrorMessage(error: FieldError | undefined): string | undefined {
  return error?.message
}

/**
 * Verifie si un champ a une erreur
 */
export function hasFieldError(error: FieldError | undefined): boolean {
  return !!error
}

/**
 * Cree les props d'input avec gestion d'erreur
 */
export function getInputProps<T extends FieldValues>(
  form: UseFormReturn<T>,
  name: Path<T>
) {
  const error = form.formState.errors[name] as FieldError | undefined
  return {
    ...form.register(name),
    error: !!error,
    helperText: error?.message,
  }
}
