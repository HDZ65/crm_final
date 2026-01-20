"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"

interface SubmitButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Texte affiché pendant la soumission */
  pendingText?: string
  /** Afficher un spinner pendant la soumission */
  showSpinner?: boolean
}

/**
 * Bouton de soumission avec état pending automatique via useFormStatus
 *
 * @example
 * <form action={formAction}>
 *   <SubmitButton>Enregistrer</SubmitButton>
 * </form>
 *
 * @example
 * <form action={formAction}>
 *   <SubmitButton pendingText="Enregistrement...">
 *     Enregistrer
 *   </SubmitButton>
 * </form>
 */
function SubmitButton({
  children,
  pendingText,
  showSpinner = true,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && showSpinner && (
        <Loader2 className="size-4 animate-spin" />
      )}
      {pending && pendingText ? pendingText : children}
    </Button>
  )
}

export { SubmitButton }
