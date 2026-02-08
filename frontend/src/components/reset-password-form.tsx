"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator"
import { checkPasswordStrength } from "@/lib/security/password-strength"
import Image from "next/image"
import logoCrm from "@/assets/logo-crm.png"

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine((password) => {
      const strength = checkPasswordStrength(password)
      return strength.score >= 2
    }, "Le mot de passe doit être au moins 'Moyen'"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps extends React.ComponentProps<"div"> {
  token?: string
}

export function ResetPasswordForm({
  token,
  className,
  ...props
}: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const password = form.watch("password")

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const { resetPasswordAction } = await import("@/actions/password-reset")
      const result = await resetPasswordAction(token || "", data.password)
      if (!result.success) {
        setError(result.error || "Erreur lors de la réinitialisation")
        return
      }
      setIsSubmitted(true)
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <FieldGroup className="gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Mot de passe réinitialisé</h1>
                  <p className="text-muted-foreground text-balance">
                    Votre mot de passe a été modifié avec succès.
                  </p>
                </div>

                <Field>
                  <Button asChild className="w-full">
                    <Link href="/login">Se connecter</Link>
                  </Button>
                </Field>
              </FieldGroup>
            </div>

            <div className="bg-[#fcfdfc] relative hidden md:block">
              <Image
                src={logoCrm}
                alt="Logo CRM"
                fill
                className="object-contain"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
            <FieldGroup className="gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
                <p className="text-muted-foreground text-balance">
                  Choisissez un nouveau mot de passe sécurisé
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <Field data-invalid={!!form.formState.errors.password}>
                <FieldLabel htmlFor="password">Nouveau mot de passe</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre nouveau mot de passe"
                  disabled={isLoading}
                  {...form.register("password")}
                />
                <PasswordStrengthIndicator password={password} />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.confirmPassword}>
                <FieldLabel htmlFor="confirmPassword">Confirmer le mot de passe</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  disabled={isLoading}
                  {...form.register("confirmPassword")}
                />
                <FieldError errors={[form.formState.errors.confirmPassword]} />
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                <Link href="/login">Retour à la connexion</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-[#fcfdfc] relative hidden md:block">
            <Image
              src={logoCrm}
              alt="Logo CRM"
              fill
              priority
              className="object-contain"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Après réinitialisation, vous serez redirigé vers la page de connexion.
      </FieldDescription>
    </div>
  )
}
