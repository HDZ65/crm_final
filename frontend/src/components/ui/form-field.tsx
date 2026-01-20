"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Props pour NativeFormField
 */
interface NativeFormFieldProps {
  /** Nom du champ (attribut name) */
  name: string
  /** Label affiché au-dessus du champ */
  label: string
  /** Liste des erreurs de validation */
  errors?: string[]
  /** Description optionnelle sous le champ */
  description?: string
  /** Classes CSS additionnelles */
  className?: string
  /** Le composant input enfant (Input, Select, etc.) */
  children: React.ReactElement<{ id?: string; name?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>
}

/**
 * Wrapper pour champs de formulaire natifs avec label et erreurs
 *
 * @example
 * <NativeFormField name="email" label="Email" errors={state.errors?.email}>
 *   <Input type="email" placeholder="votre@email.com" />
 * </NativeFormField>
 */
function NativeFormField({
  name,
  label,
  errors,
  description,
  className,
  children,
}: NativeFormFieldProps) {
  const id = React.useId()
  const hasError = errors && errors.length > 0
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`

  return (
    <div className={cn("grid gap-2", className)}>
      <Label
        htmlFor={id}
        className={cn(hasError && "text-destructive")}
      >
        {label}
      </Label>

      {React.cloneElement(children, {
        id,
        name,
        "aria-invalid": hasError || undefined,
        "aria-describedby": cn(
          hasError && errorId,
          description && descriptionId
        ) || undefined,
      })}

      {description && !hasError && (
        <p
          id={descriptionId}
          className="text-sm text-muted-foreground"
        >
          {description}
        </p>
      )}

      {hasError && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
        >
          {errors[0]}
        </p>
      )}
    </div>
  )
}

/**
 * Props pour FormError (erreurs globales)
 */
interface FormErrorProps {
  /** Liste des erreurs à afficher */
  errors?: string[]
  /** Classes CSS additionnelles */
  className?: string
}

/**
 * Affiche les erreurs globales du formulaire (erreurs _form)
 *
 * @example
 * <FormError errors={state.errors?._form} />
 */
function FormError({ errors, className }: FormErrorProps) {
  if (!errors || errors.length === 0) return null

  return (
    <div
      className={cn(
        "rounded-md bg-destructive/10 border border-destructive/20 p-3",
        className
      )}
      role="alert"
    >
      <p className="text-sm text-destructive">{errors[0]}</p>
    </div>
  )
}

/**
 * Props pour FormSuccess
 */
interface FormSuccessProps {
  /** Message de succès à afficher */
  message?: string
  /** Classes CSS additionnelles */
  className?: string
}

/**
 * Affiche un message de succès
 *
 * @example
 * {state.success && <FormSuccess message="Client créé avec succès" />}
 */
function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null

  return (
    <div
      className={cn(
        "rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3",
        className
      )}
      role="status"
    >
      <p className="text-sm text-emerald-600 dark:text-emerald-400">
        {message}
      </p>
    </div>
  )
}

export { NativeFormField, FormError, FormSuccess }
