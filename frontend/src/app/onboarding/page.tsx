"use client"

import * as React from "react"
import { Building2, ArrowRight, LogOut, CheckCircle2, ShieldCheck, Users } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/auth"
import { createOrganisationWithOwner } from "@/actions/organisations"
import { createSociete } from "@/actions/societes"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

const organizationSchema = z.object({
    name: z
        .string()
        .min(3, "Le nom doit contenir au moins 3 caractères")
        .max(50, "Le nom ne peut pas dépasser 50 caractères"),
})

type OrganizationFormValues = z.infer<typeof organizationSchema>

export default function OnboardingPage() {
    const { profile, logout, isAuthenticated } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [step, setStep] = React.useState<"input" | "processing" | "success">("input")

    const form = useForm<OrganizationFormValues>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: "",
        },
    })

    // Rediriger si pas authentifié
    React.useEffect(() => {
        if (!isAuthenticated) {
            router.push("/")
        }
    }, [isAuthenticated, router])

    const onSubmit = async (data: OrganizationFormValues) => {
        setIsLoading(true)
        setStep("processing")

        try {
            // Create organisation with current user as owner
            const orgResult = await createOrganisationWithOwner(data.name, {
                sub: profile?.id || "",
                email: profile?.email || "",
                givenName: profile?.firstName || "",
                familyName: profile?.lastName || "",
                preferredUsername: profile?.username || "",
                name: profile?.fullName || "",
            })

            if (orgResult.error) {
                toast.error(orgResult.error)
                setStep("input")
                setIsLoading(false)
                return
            }

            if (!orgResult.data?.compte?.id) {
                toast.error("Erreur lors de la création de l'organisation")
                setStep("input")
                setIsLoading(false)
                return
            }

            // Create default societe for the organisation
            const societeResult = await createSociete({
                organisationId: orgResult.data.compte.id,
                raisonSociale: data.name,
                siren: "",
                numeroTva: "",
            })

            if (societeResult.error) {
                console.warn("Societe creation warning:", societeResult.error)
                // Don't fail the whole flow if societe creation fails
            }

            const slug = data.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .substring(0, 30)

            setStep("success")
            toast.success(`Organisation "${data.name}" créée !`)

            // Redirection après succès
            setTimeout(() => {
                router.push("/") // TODO: Rediriger vers /{slug}/dashboard
            }, 2000)
        } catch (error) {
            console.error("Error creating organization:", error)
            toast.error(error instanceof Error ? error.message : "Erreur lors de la création")
            setStep("input")
        } finally {
            setIsLoading(false)
        }
    }

    const getInitials = () => {
        if (profile?.fullName) {
            return profile.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
        }
        return profile?.email?.slice(0, 2).toUpperCase() || "?"
    }

    // Écran de succès
    if (step === "success") {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
                <div className="bg-card p-8 rounded-2xl shadow-xl border max-w-md w-full text-center">
                    <div className="mx-auto size-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Tout est prêt !</h2>
                    <p className="text-muted-foreground mb-6">
                        Nous avons configuré l&apos;espace pour{" "}
                        <strong className="text-foreground">{form.getValues("name")}</strong>. Vous
                        allez être redirigé...
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-primary h-full animate-pulse w-full transition-all duration-1000"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return null
    }

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center px-4">
            {/* Header : Info Utilisateur + Déconnexion */}
            <div className="absolute top-6 right-6 flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{profile.fullName || profile.username}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <Avatar>
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => logout()}
                    title="Ce n'est pas vous ? Se deconnecter"
                    className="text-muted-foreground hover:text-destructive"
                >
                    <LogOut className="size-5" />
                </Button>
            </div>

            {/* Carte Principale */}
            <div className="max-w-lg w-full">
                {/* Logo / Marque */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary rounded-lg">
                            <Building2 className="text-primary-foreground" size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">CRM Pro</span>
                    </div>
                </div>

                <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
                    {/* En-tête de la carte */}
                    <div className="px-8 pt-8 pb-6 text-center">
                        <h1 className="text-2xl font-bold mb-2">
                            Bienvenue, {profile.firstName || profile.username?.split(" ")[0]} 👋
                        </h1>
                        <p className="text-muted-foreground">
                            Vous n&apos;êtes membre d&apos;aucune organisation pour le moment. Créez votre propre
                            espace de travail pour commencer.
                        </p>
                    </div>

                    {/* Formulaire */}
                    <div className="px-8 pb-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom de votre entreprise</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    <Input
                                                        placeholder="Ex: Acme Corp, Ma Startup..."
                                                        className="pl-10"
                                                        disabled={isLoading}
                                                        autoFocus
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Cela créera un nouvel espace où vous serez Administrateur.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    disabled={isLoading || !form.watch("name")}
                                >
                                    {isLoading ? (
                                        "Configuration de l'espace..."
                                    ) : (
                                        <>
                                            Créer mon espace
                                            <ArrowRight className="ml-2 size-5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    {/* Footer Informatif (Réassurance) */}
                    <div className="bg-muted/50 px-8 py-4 border-t grid grid-cols-2 divide-x">
                        <div className="flex flex-col items-center justify-center text-center px-2">
                            <ShieldCheck className="size-5 text-muted-foreground mb-1" />
                            <span className="text-xs font-medium text-muted-foreground">
                                Données sécurisées
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center px-2">
                            <Users className="size-5 text-muted-foreground mb-1" />
                            <span className="text-xs font-medium text-muted-foreground">
                                Invitez votre équipe
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lien d'aide */}
                <p className="text-center mt-6 text-sm text-muted-foreground">
                    Vous avez reçu une invitation par email ? <br />
                    <a
                        href="#"
                        className="text-primary hover:underline font-medium underline-offset-2"
                    >
                        Vérifiez vos spams
                    </a>{" "}
                    ou contactez votre administrateur.
                </p>
            </div>
        </div>
    )
}
