"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SubmitButton } from "@/components/ui/submit-button"
import { FormError, NativeFormField } from "@/components/ui/form-field"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { validateLoginAction } from "@/actions/auth"
import type { LoginFormData } from "@/lib/schemas/auth"
import { getInitialFormState } from "@/lib/form-state"
import logoCrm from "@/assets/logo-crm.png"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const formRef = useRef<HTMLFormElement>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const [state, formAction] = useActionState(validateLoginAction, getInitialFormState<LoginFormData>())

  // Quand la validation serveur réussit, appeler signIn de NextAuth
  useEffect(() => {
    if (state.success && state.data) {
      setAuthError(null)
      setIsSigningIn(true)

      signIn("credentials", {
        email: state.data.email,
        password: state.data.password,
        redirect: false,
      }).then((result) => {
        setIsSigningIn(false)
        if (result?.error) {
          setAuthError("Email ou mot de passe incorrect")
        } else if (result?.ok) {
          window.location.href = callbackUrl
        }
      }).catch(() => {
        setIsSigningIn(false)
        setAuthError("Une erreur est survenue. Veuillez réessayer.")
      })
    }
  }, [state.success, state.data, callbackUrl])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form ref={formRef} action={formAction} className="p-6 md:p-8">
            <FieldGroup className="gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Bienvenue</h1>
                <p className="text-muted-foreground text-balance">
                  Connectez-vous à votre compte
                </p>
              </div>

              {/* Erreur d'authentification NextAuth */}
              {authError && (
                <FormError errors={[authError]} />
              )}

              {/* Erreurs de validation serveur */}
              <FormError errors={state.errors?._form} />

              <Field data-invalid={!!state.errors?.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  disabled={isSigningIn}
                  aria-invalid={!!state.errors?.email}
                  required
                />
                {state.errors?.email && (
                  <p className="text-sm text-destructive">{state.errors.email[0]}</p>
                )}
              </Field>

              <Field data-invalid={!!state.errors?.password}>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  disabled={isSigningIn}
                  aria-invalid={!!state.errors?.password}
                  required
                />
                {state.errors?.password && (
                  <p className="text-sm text-destructive">{state.errors.password[0]}</p>
                )}
              </Field>

              <Field>
                <SubmitButton
                  disabled={isSigningIn}
                  pendingText="Vérification..."
                  className="w-full"
                >
                  {isSigningIn ? "Connexion en cours..." : "Se connecter"}
                </SubmitButton>
              </Field>

              <FieldDescription className="text-center">
                Pas encore de compte ?{" "}
                <Link href="/signup">Créer un compte</Link>
              </FieldDescription>
            </FieldGroup>
          </form>

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

      <FieldDescription className="px-6 text-center">
        En vous connectant, vous acceptez nos{" "}
        <Link href="/terms">Conditions d&apos;utilisation</Link> et notre{" "}
        <Link href="/privacy">Politique de confidentialité</Link>.
      </FieldDescription>
    </div>
  )
}
