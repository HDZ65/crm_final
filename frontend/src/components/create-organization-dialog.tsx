"use client"

import * as React from "react"
import { Building2, Loader2, ArrowRight } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCreateOrganisation } from "@/hooks/auth"

const organizationSchema = z.object({
    name: z
        .string()
        .min(3, "Le nom doit contenir au moins 3 caractères")
        .max(50, "Le nom ne peut pas dépasser 50 caractères"),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

interface CreateOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (organization: { id: string; nom: string }) => void
}

export function CreateOrganizationDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateOrganizationDialogProps) {
    const { createOrganisation, isLoading } = useCreateOrganisation()

    const form = useForm<OrganizationFormValues>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: "",
        },
    })

    const onSubmit = async (data: OrganizationFormValues) => {
        try {
            const newOrg = await createOrganisation(data.name)

            if (newOrg) {
                toast.success(`Organisation "${data.name}" créée avec succès !`)
                onOpenChange(false)
                form.reset()
                onSuccess?.(newOrg)
            }
        } catch (error: unknown) {
            console.error("Error creating organization:", error)
            toast.error(error instanceof Error ? error.message : "Erreur lors de la création de l&apos;organisation")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="size-5" />
                        Créer une organisation
                    </DialogTitle>
                    <DialogDescription>
                        Créez un nouvel espace de travail pour votre équipe. Vous serez automatiquement
                        défini comme propriétaire.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom de l&apos;organisation</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Acme Corp, Ma Startup..."
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Le nom complet de votre entreprise ou équipe
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        Créer l&apos;espace
                                        <ArrowRight className="ml-2 size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
