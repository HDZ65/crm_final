"use client"

import * as React from "react"
import { FileText, CalendarIcon, ChevronDown } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { FormCombobox, type ComboboxOption } from "@/components/ui/combobox"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useOrganisation } from "@/contexts/organisation-context"
import { getClientsByOrganisation } from "@/actions/clients"
import { getApporteursByOrganisation } from "@/actions/commerciaux"
import { createContrat } from "@/actions/contrats"
import type { ClientBase } from "@proto/clients/clients"
import type { Apporteur } from "@proto/commerciaux/commerciaux"

const contratSchema = z.object({
    organisationId: z.string().uuid("ID organisation invalide"),
    reference: z.string().min(1, "Référence requise"),
    statut: z.string().min(1, "Statut requis"),
    dateDebut: z.date({ error: "Date de début requise" }),
    clientId: z.string().uuid("Client requis"),
    commercialId: z.string().uuid("Commercial requis"),
    // Optionnels
    titre: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    dateFin: z.date().optional().nullable(),
    dateSignature: z.date().optional().nullable(),
    montant: z.number().optional().nullable(),
    devise: z.string().optional(),
    frequenceFacturation: z.string().optional(),
    fournisseur: z.string().optional(),
    jourPrelevement: z.coerce.number().min(1).max(28).optional(),
    notes: z.string().optional(),
})

type ContratFormValues = z.input<typeof contratSchema>
type ContratSubmitValues = z.output<typeof contratSchema>

interface CreateContratDto {
    organisationId: string
    reference: string
    statut: string
    dateDebut: string
    clientId: string
    commercialId: string
    titre?: string
    description?: string
    type?: string
    dateFin?: string
    dateSignature?: string
    montant?: number
    devise?: string
    frequenceFacturation?: string
    fournisseur?: string
    jour_prelevement?: number
    notes?: string
}

interface ContratResponse extends CreateContratDto {
    id: string
    createdAt: string
    updatedAt: string
}

interface CreateContratDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (contrat: ContratResponse) => void
}

const STATUTS = [
    { value: "brouillon", label: "Brouillon" },
    { value: "en_attente", label: "En attente" },
    { value: "actif", label: "Actif" },
    { value: "suspendu", label: "Suspendu" },
    { value: "resilie", label: "Résilié" },
    { value: "termine", label: "Terminé" },
]

const FREQUENCES = [
    { value: "unique", label: "Paiement unique" },
    { value: "mensuel", label: "Mensuel" },
    { value: "trimestriel", label: "Trimestriel" },
    { value: "annuel", label: "Annuel" },
]

export function CreateContratDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateContratDialogProps) {
    const { activeOrganisation } = useOrganisation()
    const organisationId = activeOrganisation?.organisationId || ""
    const [showMore, setShowMore] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    // State for clients and apporteurs
    const [clients, setClients] = React.useState<ClientBase[]>([])
    const [apporteurs, setApporteurs] = React.useState<Apporteur[]>([])
    const [loadingClients, setLoadingClients] = React.useState(false)
    const [loadingApporteurs, setLoadingApporteurs] = React.useState(false)

    // Fetch clients when dialog opens
    React.useEffect(() => {
        if (!open || !organisationId) return
        setLoadingClients(true)
        getClientsByOrganisation({ organisationId }).then((result) => {
            if (result.data) {
                setClients(result.data.clients || [])
            }
            setLoadingClients(false)
        })
    }, [open, organisationId])

    // Fetch apporteurs when dialog opens
    React.useEffect(() => {
        if (!open || !organisationId) return
        setLoadingApporteurs(true)
        getApporteursByOrganisation(organisationId).then((result) => {
            if (result.data) {
                setApporteurs(result.data.apporteurs || [])
            }
            setLoadingApporteurs(false)
        })
    }, [open, organisationId])

    const clientOptions: ComboboxOption[] = React.useMemo(() =>
        clients.map(c => ({
            value: c.id,
            label: `${c.prenom || ''} ${c.nom || ''}`.trim() || c.email || 'Client',
            description: c.email || c.telephone || undefined,
        })),
        [clients]
    )

    const commercialOptions: ComboboxOption[] = React.useMemo(() =>
        apporteurs.map(a => ({
            value: a.id,
            label: `${a.prenom || ''} ${a.nom || ''}`.trim() || a.email || 'Commercial',
            description: a.email || undefined,
        })),
        [apporteurs]
    )

    const isLoadingData = loadingClients || loadingApporteurs

    const form = useForm<ContratFormValues, unknown, ContratSubmitValues>({
        resolver: zodResolver(contratSchema),
        defaultValues: {
            organisationId: "",
            reference: "",
            statut: "brouillon",
            clientId: "",
            commercialId: "",
            titre: "",
            description: "",
            type: "",
            devise: "EUR",
            frequenceFacturation: "",
            fournisseur: "",
            notes: "",
        },
    })

    React.useEffect(() => {
        if (organisationId) {
            form.setValue("organisationId", organisationId)
        }
    }, [organisationId, form])

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            form.reset()
            setShowMore(false)
        }
        onOpenChange(isOpen)
    }

    const onSubmit = async (data: ContratSubmitValues) => {
        setLoading(true)

        const result = await createContrat({
            organisationId: data.organisationId,
            reference: data.reference,
            statut: data.statut,
            dateDebut: format(data.dateDebut, "yyyy-MM-dd"),
            clientId: data.clientId,
            commercialId: data.commercialId,
            titre: data.titre || undefined,
            description: data.description || undefined,
            type: data.type || undefined,
            dateFin: data.dateFin ? format(data.dateFin, "yyyy-MM-dd") : undefined,
            dateSignature: data.dateSignature ? format(data.dateSignature, "yyyy-MM-dd") : undefined,
            montant: data.montant ?? undefined,
            devise: data.devise || undefined,
            frequenceFacturation: data.frequenceFacturation || undefined,
            fournisseur: data.fournisseur || undefined,
            jour_prelevement: data.jourPrelevement,
            notes: data.notes || undefined,
        })

        setLoading(false)

        if (result.data) {
            toast.success("Contrat créé avec succès !")
            onOpenChange(false)
            form.reset()
            setShowMore(false)
            // Map gRPC Contrat to ContratResponse for onSuccess callback
            const contratResponse: ContratResponse = {
                id: result.data.id,
                organisationId: result.data.organisationId,
                reference: result.data.reference,
                statut: result.data.statut,
                dateDebut: result.data.dateDebut,
                clientId: result.data.clientId,
                commercialId: result.data.commercialId,
                titre: result.data.titre,
                description: result.data.description,
                type: result.data.type,
                dateFin: result.data.dateFin,
                dateSignature: result.data.dateSignature,
                montant: result.data.montant,
                devise: result.data.devise,
                frequenceFacturation: result.data.frequenceFacturation,
                fournisseur: result.data.fournisseur,
                jour_prelevement: (result.data as any).jour_prelevement,
                notes: result.data.notes,
                createdAt: result.data.createdAt,
                updatedAt: result.data.updatedAt,
            }
            onSuccess?.(contratResponse)
        } else {
            toast.error(result.error || "Erreur lors de la création du contrat")
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="size-5" />
                        Nouveau contrat
                    </DialogTitle>
                    <DialogDescription>
                        Renseignez les informations du contrat.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Champs requis */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="reference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Référence *</FormLabel>
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
                            <FormField
                                control={form.control}
                                name="statut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Statut *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {STATUTS.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client *</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={clientOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner"
                                                searchPlaceholder="Rechercher..."
                                                emptyMessage="Aucun client"
                                                disabled={loading || isLoadingData}
                                                loading={loadingClients}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="commercialId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Commercial *</FormLabel>
                                        <FormControl>
                                            <FormCombobox
                                                options={commercialOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Sélectionner"
                                                searchPlaceholder="Rechercher..."
                                                emptyMessage="Aucun commercial"
                                                disabled={loading || isLoadingData}
                                                loading={loadingApporteurs}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dateDebut"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date de début *</FormLabel>
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
                                                            <span>Sélectionner</span>
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
                            <FormField
                                control={form.control}
                                name="montant"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Montant (€)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                disabled={loading}
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Champs optionnels (dépliables) */}
                        <Collapsible open={showMore} onOpenChange={setShowMore}>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" type="button" className="w-full justify-between text-muted-foreground">
                                    Plus d&apos;options
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", showMore && "rotate-180")} />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="titre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Titre</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Titre du contrat" disabled={loading} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Type de contrat" disabled={loading} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                                                {field.value ? format(field.value, "dd/MM/yyyy", { locale: fr }) : <span>Sélectionner</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} locale={fr} />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dateSignature"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Date signature</FormLabel>
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
                                                                {field.value ? format(field.value, "dd/MM/yyyy", { locale: fr }) : <span>Sélectionner</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} locale={fr} />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="frequenceFacturation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fréquence</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {FREQUENCES.map((f) => (
                                                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fournisseur"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fournisseur</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nom du fournisseur" disabled={loading} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="jourPrelevement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Jour de prélèvement</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={28}
                                                    placeholder="Ex: 15"
                                                    disabled={loading}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Description..." className="resize-none" rows={2} disabled={loading} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes internes</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Notes..." className="resize-none" rows={2} disabled={loading} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CollapsibleContent>
                        </Collapsible>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Création..." : "Créer"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
