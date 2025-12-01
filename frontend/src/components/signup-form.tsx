"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
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
import Image from "next/image"
import logoCrm from "@/assets/logo-crm.png"

const signupSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Créer le compte dans Keycloak
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Erreur lors de la création du compte")
        return
      }

      // 2. Connecter automatiquement l'utilisateur
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        // Compte créé mais connexion échouée, rediriger vers login
        window.location.href = "/login?registered=true"
      } else if (signInResult?.ok) {
        window.location.href = callbackUrl
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
            <FieldGroup className="gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Créer un compte</h1>
                <p className="text-muted-foreground text-balance">
                  Inscrivez-vous pour accéder à la plateforme
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!form.formState.errors.nom}>
                  <FieldLabel htmlFor="nom">Nom</FieldLabel>
                  <Input
                    id="nom"
                    type="text"
                    placeholder="Dupont"
                    disabled={isLoading}
                    {...form.register("nom")}
                  />
                  <FieldError errors={[form.formState.errors.nom]} />
                </Field>

                <Field data-invalid={!!form.formState.errors.prenom}>
                  <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
                  <Input
                    id="prenom"
                    type="text"
                    placeholder="Jean"
                    disabled={isLoading}
                    {...form.register("prenom")}
                  />
                  <FieldError errors={[form.formState.errors.prenom]} />
                </Field>
              </div>

              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  disabled={isLoading}
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.password}>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  disabled={isLoading}
                  {...form.register("password")}
                />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    "Créer mon compte"
                  )}
                </Button>
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
