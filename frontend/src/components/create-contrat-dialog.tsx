"use client"

import * as React from "react"
import { FileText, Loader2, CalendarIcon } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { FormCombobox, type ComboboxOption } from "@/components/ui/combobox"
import { toast } from "sonner"
import { useApiPost } from "@/hooks/core"
import { cn } from "@/lib/utils"
import { useClients } from "@/hooks/clients"
import { useGroupeEntites } from "@/hooks/clients/use-groupe-entites"
import { useApporteurs } from "@/hooks/commissions/use-apporteurs"
import {
    useContractReferenceData,
    useAdressesClient,
} from "@/hooks/contracts"
import { useOrganisation } from "@/contexts/organisation-context"

const contratSchema = z.object({
    organisationId: z.string().uuid("ID organisation invalide"),
    referenceExterne: z.string().min(1, "Référence requise"),
    dateSignature: z.date({ error: "Date de signature requise" }),
    dateDebut: z.date({ error: "Date de début requise" }),
    dateFin: z.date({ error: "Date de fin requise" }),
    statutId: z.string().uuid("Statut requis"),
    autoRenouvellement: z.boolean(),
    joursPreavis: z.number().min(0, "Jours de préavis invalide"),
    conditionPaiementId: z.string().uuid("Condition de paiement requise"),
    modeleDistributionId: z.string().uuid("Modèle de distribution requis"),
    facturationParId: z.string().uuid("Facturation par requis"),
    clientBaseId: z.string().uuid("Client requis"),
    societeId: z.string().uuid("Société requise"),
    commercialId: z.string().uuid("Commercial requis"),
    clientPartenaireId: z.string().uuid("Partenaire requis"),
    adresseFacturationId: z.string().uuid("Adresse de facturation requise"),
    dateFinRetractation: z.date({ error: "Date fin rétractation requise" }),
})

type ContratFormValues = z.infer<typeof contratSchema>

interface CreateContratDto {
    organisationId: string
    referenceExterne: string
    dateSignature: string
    dateDebut: string
    dateFin: string
    statutId: string
    autoRenouvellement: boolean
    joursPreavis: number
    conditionPaiementId: string
    modeleDistributionId: string
    facturationParId: string
    clientBaseId: string
    societeId: string
    commercialId: string
    clientPartenaireId: string
    adresseFacturationId: string
    dateFinRetractation: string
}

interface Contrat extends CreateContratDto {
    id: string
    createdAt: string
    updatedAt: string
}

interface CreateContratDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (contrat: Contrat) => void
}

export function CreateContratDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateContratDialogProps) {
    // Récupérer l'organisationId depuis le context
    const { activeOrganisation } = useOrganisation()
    const organisationId = activeOrganisation?.id || ""

    // Charger les données de référence
    const { clients, loading: loadingClients } = useClients()
    const { societes, loading: loadingSocietes } = useGroupeEntites(organisationId)
    const { apporteurs, loading: loadingApporteurs } = useApporteurs({ organisationId })
    const {
        conditionsPaiement,
        modelesDistribution,
        statutsContrat,
        partenaires,
        loading: loadingRefData,
    } = useContractReferenceData()

    // État pour l'ID client sélectionné (pour charger les adresses)
    const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null)
    const { adresses, loading: loadingAdresses } = useAdressesClient(selectedClientId)

    // Préparer les options pour les combobox
    const clientOptions: ComboboxOption[] = React.useMemo(() =>
        clients.map(c => ({
            value: c.id,
            label: c.name,
            description: c.email || c.phone || undefined,
        })),
        [clients]
    )

    const societeOptions: ComboboxOption[] = React.useMemo(() =>
        societes.map(s => ({
            value: s.id,
            label: s.raisonSociale,
            description: s.siren || undefined,
        })),
        [societes]
    )

    const commercialOptions: ComboboxOption[] = React.useMemo(() =>
        apporteurs.map(a => ({
            value: a.id,
            label: `${a.nom || ''} ${a.prenom || ''}`.trim() || a.email || 'Commercial',
            description: a.email || undefined,
        })),
        [apporteurs]
    )

    const partenaireOptions: ComboboxOption[] = React.useMemo(() =>
        partenaires.map(p => ({
            value: p.id,
            label: p.nom,
            description: p.code || undefined,
        })),
        [partenaires]
    )

    const statutOptions: ComboboxOption[] = React.useMemo(() =>
        statutsContrat.map(s => ({
            value: s.id,
            label: s.nom,
            description: s.description || undefined,
        })),
        [statutsContrat]
    )

    const conditionPaiementOptions: ComboboxOption[] = React.useMemo(() =>
        conditionsPaiement.map(c => ({
            value: c.id,
            label: c.nom,
            description: c.delaiJours ? `${c.delaiJours} jours` : undefined,
        })),
        [conditionsPaiement]
    )

    const modeleDistributionOptions: ComboboxOption[] = React.useMemo(() =>
        modelesDistribution.map(m => ({
            value: m.id,
            label: m.nom,
            description: m.description || undefined,
        })),
        [modelesDistribution]
    )

    const adresseOptions: ComboboxOption[] = React.useMemo(() =>
        adresses.map(a => ({
            value: a.id,
            label: `${a.ligne1}, ${a.codePostal} ${a.ville}`,
            description: a.type || undefined,
        })),
        [adresses]
    )

    const isLoadingData = loadingClients || loadingSocietes || loadingApporteurs || loadingRefData

    const { loading, execute: createContrat } = useApiPost<Contrat, CreateContratDto>(
        "/contrats",
        {
            onSuccess: (data) => {
                toast.success("Contrat créé avec succès !")
                onOpenChange(false)
                form.reset()
                onSuccess?.(data)
            },
            onError: (error) => {
                toast.error(error.message || "Erreur lors de la création du contrat")
            },
        }
    )

    const form = useForm<ContratFormValues>({
        resolver: zodResolver(contratSchema),
        defaultValues: {
            organisationId: "",
            referenceExterne: "",
            autoRenouvellement: false,
            joursPreavis: 30,
            statutId: "",
            conditionPaiementId: "",
            modeleDistributionId: "",
            facturationParId: "",
            clientBaseId: "",
            societeId: "",
            commercialId: "",
            clientPartenaireId: "",
            adresseFacturationId: "",
        },
    })

    React.useEffect(() => {
        if (organisationId) {
            form.setValue("organisationId", organisationId)
        }
    }, [organisationId, form])

    // Reset le formulaire quand le dialog se ferme
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            form.reset()
        }
        onOpenChange(isOpen)
    }

    const onSubmit = async (data: ContratFormValues) => {
        const payload: CreateContratDto = {
            ...data,
            dateSignature: format(data.dateSignature, "yyyy-MM-dd"),
            dateDebut: format(data.dateDebut, "yyyy-MM-dd"),
            dateFin: format(data.dateFin, "yyyy-MM-dd"),
            dateFinRetractation: format(data.dateFinRetractation, "yyyy-MM-dd"),
        }

        try {
            await createContrat(payload)
        } catch {
            // Error handled by useApiPost
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Nouveau contrat
                    </DialogTitle>
                    <DialogDescription>
                        Créez un nouveau contrat en renseignant les informations ci-dessous.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Référence externe */}
                            <FormField
                                control={form.control}
                                name="referenceExterne"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Référence externe</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="CTR-2024-001"
                                                disabled={loading || isLoadingData}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Client */}
                            <FormField
                                control={form.control}
                                name="clientBaseId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={clientOptions}
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(value)
                                                    setSelectedClientId(value || null)
                                                }}
                                                placeholder="Sélectionner un client"
                                                searchPlaceholder="Rechercher un client..."
                                                emptyMessage="Aucun client trouvé"
                                                disabled={loading || isLoadingData}
                                                loading={loadingClients}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Société */}
                            <FormField
                                control={form.control}
                                name="societeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Société</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={societeOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner une société"
                                                searchPlaceholder="Rechercher une société..."
                                                emptyMessage="Aucune société trouvée"
                                                disabled={loading || isLoadingData}
                                                loading={loadingSocietes}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Commercial */}
                            <FormField
                                control={form.control}
                                name="commercialId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commercial</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={commercialOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner un commercial"
                                                searchPlaceholder="Rechercher un commercial..."
                                                emptyMessage="Aucun commercial trouvé"
                                                disabled={loading || isLoadingData}
                                                loading={loadingApporteurs}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Partenaire */}
                            <FormField
                                control={form.control}
                                name="clientPartenaireId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Partenaire</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={partenaireOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner un partenaire"
                                                searchPlaceholder="Rechercher un partenaire..."
                                                emptyMessage="Aucun partenaire trouvé"
                                                disabled={loading || isLoadingData}
                                                loading={loadingRefData}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Statut */}
                            <FormField
                                control={form.control}
                                name="statutId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Statut</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={statutOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner un statut"
                                                searchPlaceholder="Rechercher un statut..."
                                                emptyMessage="Aucun statut trouvé"
                                                disabled={loading || isLoadingData}
                                                loading={loadingRefData}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Date de signature */}
                            <FormField
                                control={form.control}
                                name="dateSignature"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date de signature</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={loading}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: fr })
                                                        ) : (
                                                            <span>Sélectionner une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={loading}
                                                    locale={fr}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Date de début */}
                            <FormField
                                control={form.control}
                                name="dateDebut"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date de début</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={loading}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: fr })
                                                        ) : (
                                                            <span>Sélectionner une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={loading}
                                                    locale={fr}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Date de fin */}
                            <FormField
                                control={form.control}
                                name="dateFin"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date de fin</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={loading}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: fr })
                                                        ) : (
                                                            <span>Sélectionner une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={loading}
                                                    locale={fr}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Date fin rétractation */}
                            <FormField
                                control={form.control}
                                name="dateFinRetractation"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date fin rétractation</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        disabled={loading}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: fr })
                                                        ) : (
                                                            <span>Sélectionner une date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={loading}
                                                    locale={fr}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Conditions et options */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Condition de paiement */}
                            <FormField
                                control={form.control}
                                name="conditionPaiementId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condition de paiement</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={conditionPaiementOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner une condition"
                                                searchPlaceholder="Rechercher..."
                                                emptyMessage="Aucune condition trouvée"
                                                disabled={loading || isLoadingData}
                                                loading={loadingRefData}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Modèle de distribution */}
                            <FormField
                                control={form.control}
                                name="modeleDistributionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modèle de distribution</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={modeleDistributionOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner un modèle"
                                                searchPlaceholder="Rechercher..."
                                                emptyMessage="Aucun modèle trouvé"
                                                disabled={loading || isLoadingData}
                                                loading={loadingRefData}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Facturation par */}
                            <FormField
                                control={form.control}
                                name="facturationParId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Facturation par</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={societeOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner la société facturante"
                                                searchPlaceholder="Rechercher..."
                                                emptyMessage="Aucune société trouvée"
                                                disabled={loading || isLoadingData}
                                                loading={loadingSocietes}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Adresse de facturation */}
                            <FormField
                                control={form.control}
                                name="adresseFacturationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse de facturation</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={adresseOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={selectedClientId ? "Sélectionner une adresse" : "Sélectionnez d'abord un client"}
                                                searchPlaceholder="Rechercher..."
                                                emptyMessage="Aucune adresse trouvée"
                                                disabled={loading || isLoadingData || !selectedClientId}
                                                loading={loadingAdresses}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Préavis et renouvellement */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Jours de préavis */}
                            <FormField
                                control={form.control}
                                name="joursPreavis"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jours de préavis</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="30"
                                                disabled={loading}
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Auto-renouvellement */}
                            <FormField
                                control={form.control}
                                name="autoRenouvellement"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>Auto-renouvellement</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={loading}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    "Créer le contrat"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
