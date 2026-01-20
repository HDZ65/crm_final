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
import Image from "next/image"
import logoCrm from "@/assets/logo-crm.png"

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true)

    try {
      // TODO: Implement password reset API call
      console.log("Password reset requested for:", data.email)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (err) {
      console.error(err)
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
                  <h1 className="text-2xl font-bold">Email envoyé</h1>
                  <p className="text-muted-foreground text-balance">
                    Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
                  </p>
                </div>

                <Field>
                  <Button asChild className="w-full">
                    <Link href="/login">Retour à la connexion</Link>
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
                <h1 className="text-2xl font-bold">Mot de passe oublié ?</h1>
                <p className="text-muted-foreground text-balance">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
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

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
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
              className="object-contain"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
      </FieldDescription>
    </div>
  )
}
