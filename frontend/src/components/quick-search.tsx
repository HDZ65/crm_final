"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Maximize2, Search, User, Mail, Phone } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useClientSearchStore } from "@/stores/client-search-store"

const formSchema = z.object({
  name: z
    .string()
    .refine(
      (val) => !val || val.length >= 1,
      "Le nom doit contenir au moins 1 caractère"
    )
    .refine(
      (val) => !val || val.length <= 50,
      "Le nom ne peut pas dépasser 50 caractères"
    )
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      "Veuillez entrer une adresse email valide"
    )
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .refine(
      (val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val),
      "Veuillez entrer un numéro de téléphone français valide"
    )
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    const hasName = data.name && data.name.trim() !== ""
    const hasEmail = data.email && data.email.trim() !== ""
    const hasPhone = data.phone && data.phone.trim() !== ""
    return hasName || hasEmail || hasPhone
  },
  {
    message: "Veuillez remplir au moins un champ de recherche",
    path: ["name"],
  }
)

export function QuickSearch() {
  const router = useRouter()
  const applyQuickSearch = useClientSearchStore((state) => state.applyQuickSearch)
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    // Appliquer les filtres via le store Zustand
    applyQuickSearch({
      name: data.name?.trim(),
      email: data.email?.trim(),
      phone: data.phone?.trim(),
    })

    // Naviguer vers la page clients (sans params URL)
    router.push("/clients")

    // Fermer le dialog si ouvert
    setDialogOpen(false)

    // Réinitialiser le formulaire après recherche
    form.reset()
  }

  const hasErrors = Object.keys(form.formState.errors).length > 0
  const isDirty = form.formState.isDirty

  const formContent = (
    <form
      id="quick-search-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="quick-search-name" className="flex items-center">
                    <User className="size-4" />
                    Nom / Prénom
                  </FieldLabel>
                  <Input
                    {...field}
                    id="quick-search-name"
                    placeholder="Ex: Jean Dupont"
                    className="bg-white"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="quick-search-email" className="flex items-center gap-2">
                    <Mail className="size-4" />
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="quick-search-email"
                    type="email"
                    placeholder="exemple@email.fr"
                    className="bg-white"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="quick-search-phone" className="flex items-center gap-2">
                    <Phone className="size-4" />
                    Téléphone
                  </FieldLabel>
                  <Input
                    {...field}
                    id="quick-search-phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="bg-white"
                    aria-invalid={fieldState.invalid}
                    autoComplete="tel"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <Field orientation="horizontal" className="mt-2">
          <Button
            type="submit"
            className="w-full sm:w-auto gap-2"
            disabled={hasErrors || !isDirty}
          >
            <Search className="size-4" />
            Rechercher
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => form.reset()}
            disabled={!isDirty}
          >
            Réinitialiser
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <CardTitle className="text-base md:text-lg">
              Recherche rapide
            </CardTitle>
          </div>
          <CardAction>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Agrandir la carte">
                <Maximize2 className="size-4" />
              </Button>
            </DialogTrigger>
          </CardAction>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {formContent}
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden ">
        <div className="">
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base md:text-lg">Recherche rapide</DialogTitle>
            </div>
          </div>
          <div className="p-6 pt-2">
              {formContent}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
