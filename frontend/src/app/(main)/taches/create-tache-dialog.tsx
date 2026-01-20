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
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useOrganisation } from "@/contexts/organisation-context"
import { useAuth } from "@/hooks/auth"
import { listMembresWithUsers, type MembreWithUserDto } from "@/actions/membres"
import { toast } from "sonner"
import type { TacheType, TachePriorite } from "@/types/tache"
import { TACHE_TYPE_LABELS, TACHE_PRIORITE_LABELS } from "@/types/tache"
import { createTache } from "@/actions/taches"

const formSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  type: z.enum(['APPEL', 'EMAIL', 'RDV', 'RELANCE_IMPAYE', 'RELANCE_CONTRAT', 'RENOUVELLEMENT', 'SUIVI', 'AUTRE']),
  priorite: z.enum(['HAUTE', 'MOYENNE', 'BASSE']),
  dateEcheance: z.date({ message: "La date d'échéance est requise" }),
  assigneA: z.string().min(1, "L'assignation est requise"),
})

type FormValues = z.infer<typeof formSchema>

interface CreateTacheDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  clientId?: string
  contratId?: string
}

export function CreateTacheDialog({
  open,
  onOpenChange,
  onSuccess,
  clientId,
  contratId,
}: CreateTacheDialogProps) {
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
      dateEcheance: new Date(),
      assigneA: "",
    },
  })

  // Set current user as default assignee when found in members
  React.useEffect(() => {
    if (currentUserDbId && !form.getValues("assigneA")) {
      form.setValue("assigneA", currentUserDbId)
    }
  }, [currentUserDbId, form])

  const onSubmit = async (values: FormValues) => {
    if (!activeOrganisation?.organisationId || !currentUserDbId) {
      toast.error("Erreur de configuration - utilisateur non trouvé")
      return
    }

    setLoading(true)
    const result = await createTache({
      organisationId: activeOrganisation.organisationId,
      titre: values.titre,
      description: values.description,
      type: values.type as TacheType,
      priorite: values.priorite as TachePriorite,
      dateEcheance: values.dateEcheance.toISOString(),
      assigneA: values.assigneA,
      creePar: currentUserDbId,
      clientId,
      contratId,
    })
    setLoading(false)

    if (result.data) {
      toast.success("Tâche créée avec succès")
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.error || "Erreur lors de la création de la tâche")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
          <DialogDescription>
            Créez une nouvelle tâche pour suivre vos actions commerciales.
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                      defaultValue={field.value}
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
            </div>

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
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
