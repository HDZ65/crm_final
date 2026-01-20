"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useOrganisation } from "@/contexts/organisation-context"
import { useAuth } from "@/hooks/auth"
import { listMembresWithUsers, type MembreWithUserDto } from "@/actions/membres"
import { toast } from "sonner"
import type { TacheDto, TacheType, TachePriorite, TacheStatut } from "@/types/tache"
import {
  TACHE_TYPE_LABELS,
  TACHE_PRIORITE_LABELS,
  TACHE_STATUT_LABELS,
} from "@/types/tache"
import { updateTache } from "@/actions/taches"

const formSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  type: z.enum(['APPEL', 'EMAIL', 'RDV', 'RELANCE_IMPAYE', 'RELANCE_CONTRAT', 'RENOUVELLEMENT', 'SUIVI', 'AUTRE']),
  priorite: z.enum(['HAUTE', 'MOYENNE', 'BASSE']),
  statut: z.enum(['A_FAIRE', 'EN_COURS', 'TERMINEE', 'ANNULEE']),
  dateEcheance: z.date({ message: "La date d'échéance est requise" }),
  assigneA: z.string().min(1, "L'assignation est requise"),
})

type FormValues = z.infer<typeof formSchema>

interface EditTacheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tache: TacheDto | null
  onSuccess?: () => void
}

export function EditTacheDialog({
  open,
  onOpenChange,
  tache,
  onSuccess,
}: EditTacheDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const { profile } = useAuth()
  const [membres, setMembres] = React.useState<MembreWithUserDto[]>([])
  const [loading, setLoading] = React.useState(false)

  // Fetch membres
  React.useEffect(() => {
    if (!activeOrganisation?.organisationId || !open) return
    listMembresWithUsers(activeOrganisation.organisationId).then((result) => {
      if (result.data) setMembres(result.data)
    })
  }, [activeOrganisation?.organisationId, open])

  // Trouver l'ID utilisateur de la base de données à partir de l'email
  const currentUserDbId = React.useMemo(() => {
    if (!profile?.email || !membres.length) return null
    const currentMembre = membres.find(
      (m) => m.utilisateur?.email === profile.email
    )
    return currentMembre?.utilisateurId || null
  }, [profile?.email, membres])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titre: "",
      description: "",
      type: "AUTRE",
      priorite: "MOYENNE",
      statut: "A_FAIRE",
      dateEcheance: new Date(),
      assigneA: "",
    },
  })

  // Reset form when tache changes
  React.useEffect(() => {
    if (tache) {
      form.reset({
        titre: tache.titre,
        description: tache.description || "",
        type: tache.type as TacheType,
        priorite: tache.priorite as TachePriorite,
        statut: tache.statut as TacheStatut,
        dateEcheance: new Date(tache.dateEcheance),
        assigneA: tache.assigneA,
      })
    }
  }, [tache, form])

  const onSubmit = async (values: FormValues) => {
    if (!tache) return

    setLoading(true)
    const result = await updateTache(tache.id, {
      titre: values.titre,
      description: values.description,
      type: values.type as TacheType,
      priorite: values.priorite as TachePriorite,
      statut: values.statut as TacheStatut,
      dateEcheance: values.dateEcheance.toISOString(),
      assigneA: values.assigneA,
    })
    setLoading(false)

    if (result.data) {
      toast.success("Tâche mise à jour avec succès")
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.error || "Erreur lors de la mise à jour de la tâche")
    }
  }

  const getMembreName = (membre: typeof membres[0]) => {
    if (membre.utilisateur?.prenom || membre.utilisateur?.nom) {
      return [membre.utilisateur.prenom, membre.utilisateur.nom]
        .filter(Boolean)
        .join(" ")
    }
    return membre.utilisateur?.email || "Utilisateur inconnu"
  }

  if (!tache) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modifier la tâche</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Créée le {format(new Date(tache.createdAt), "PPP", { locale: fr })}
            {tache.enRetard && (
              <Badge variant="destructive" className="ml-2">
                En retard
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Appeler le client X" {...field} />
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
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Détails supplémentaires..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TACHE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priorite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TACHE_PRIORITE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TACHE_STATUT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                name="assigneA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigner à</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un membre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {membres.map((membre) => (
                          <SelectItem
                            key={membre.utilisateurId}
                            value={membre.utilisateurId}
                          >
                            {getMembreName(membre)}
                            {membre.utilisateurId === currentUserDbId && " (moi)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateEcheance"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date d&apos;échéance</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: fr })
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
                          initialFocus
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Info section */}
            {(tache.clientId || tache.contratId) && (
              <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
                {tache.clientId && (
                  <p>
                    <span className="text-muted-foreground">Client:</span>{" "}
                    {tache.clientId}
                  </p>
                )}
                {tache.contratId && (
                  <p>
                    <span className="text-muted-foreground">Contrat:</span>{" "}
                    {tache.contratId}
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
