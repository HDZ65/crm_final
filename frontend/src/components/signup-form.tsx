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
import { FormError } from "@/components/ui/form-field"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { signupAction } from "@/actions/auth"
import { getInitialFormState } from "@/lib/forms/state"
import logoCrm from "@/assets/logo-crm.png"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const formRef = useRef<HTMLFormElement>(null)
  const emailRef = useRef<string>("")
  const passwordRef = useRef<string>("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const [state, formAction] = useActionState(signupAction, getInitialFormState<{ success: boolean }>())

  // Quand l'inscription réussit, connecter automatiquement
  useEffect(() => {
    if (state.success) {
      setAuthError(null)
      setIsSigningIn(true)

      signIn("credentials", {
        email: emailRef.current,
        password: passwordRef.current,
        redirect: false,
      }).then((result) => {
        setIsSigningIn(false)
        if (result?.error) {
          // Compte créé mais connexion échouée, rediriger vers login
          window.location.href = "/login?registered=true"
        } else if (result?.ok) {
          window.location.href = callbackUrl
        }
      }).catch(() => {
        setIsSigningIn(false)
        setAuthError("Compte créé. Veuillez vous connecter.")
        window.location.href = "/login?registered=true"
      })
    }
  }, [state.success, callbackUrl])

  // Capturer email/password avant soumission pour auto-login
  const handleSubmit = (formData: FormData) => {
    emailRef.current = formData.get("email") as string
    passwordRef.current = formData.get("password") as string
    formAction(formData)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form ref={formRef} action={handleSubmit} className="p-6 md:p-8">
            <FieldGroup className="gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Créer un compte</h1>
                <p className="text-muted-foreground text-balance">
                  Inscrivez-vous pour accéder à la plateforme
                </p>
              </div>

              {/* Erreur d'authentification */}
              {authError && <FormError errors={[authError]} />}

              {/* Erreurs de validation serveur */}
              <FormError errors={state.errors?._form} />

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!state.errors?.nom}>
                  <FieldLabel htmlFor="nom">Nom</FieldLabel>
                  <Input
                    id="nom"
                    name="nom"
                    type="text"
                    placeholder="Dupont"
                    disabled={isSigningIn}
                    aria-invalid={!!state.errors?.nom}
                    required
                  />
                  {state.errors?.nom && (
                    <p className="text-sm text-destructive">{state.errors.nom[0]}</p>
                  )}
                </Field>

                <Field data-invalid={!!state.errors?.prenom}>
                  <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
                  <Input
                    id="prenom"
                    name="prenom"
                    type="text"
                    placeholder="Jean"
                    disabled={isSigningIn}
                    aria-invalid={!!state.errors?.prenom}
                    required
                  />
                  {state.errors?.prenom && (
                    <p className="text-sm text-destructive">{state.errors.prenom[0]}</p>
                  )}
                </Field>
              </div>

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
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  disabled={isSigningIn}
                  aria-invalid={!!state.errors?.password}
                  required
                  minLength={8}
                />
                {state.errors?.password && (
                  <p className="text-sm text-destructive">{state.errors.password[0]}</p>
                )}
              </Field>

              <Field>
                <SubmitButton
                  disabled={isSigningIn}
                  pendingText="Création en cours..."
                  className="w-full"
                >
                  {isSigningIn ? "Connexion..." : "Créer mon compte"}
                </SubmitButton>
              </Field>

              <FieldDescription className="text-center">
                Déjà un compte ?{" "}
                <Link href="/login">Se connecter</Link>
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
        En créant un compte, vous acceptez nos{" "}
        <Link href="/terms">Conditions d&apos;utilisation</Link> et notre{" "}
        <Link href="/privacy">Politique de confidentialité</Link>.
      </FieldDescription>
    </div>
  )
}
