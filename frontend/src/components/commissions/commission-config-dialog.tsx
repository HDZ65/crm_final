"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BaremesList } from "./baremes-list"
import { ApporteursList, type CreateApporteurData } from "./apporteurs-list"
import { useOrganisation } from "@/contexts/organisation-context"
import {
  getApporteursByOrganisation,
  createApporteur as createApporteurAction,
  activerApporteur,
  desactiverApporteur,
} from "@/actions/commerciaux"
import { getBaremesByOrganisation } from "@/actions/commissions"
import { commissionConfig } from "@/lib/config/commission"
import type { Apporteur } from "@proto/commerciaux/commerciaux"
import type { BaremeWithPaliers } from "@/lib/ui/display-types/commission"
import { Users, Settings, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface CommissionConfigDialogProps {
  trigger: React.ReactNode
}

export function CommissionConfigDialog({ trigger }: CommissionConfigDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("apporteurs")

  // State for apporteurs
  const [apporteurs, setApporteurs] = React.useState<Apporteur[]>([])
  const [loadingApporteurs, setLoadingApporteurs] = React.useState(false)
  const [editingApporteur, setEditingApporteur] = React.useState<Apporteur | null>(null)

  // State for baremes
  const [baremes, setBaremes] = React.useState<BaremeWithPaliers[]>([])
  const [loadingBaremes, setLoadingBaremes] = React.useState(false)
  const [errorBaremes, setErrorBaremes] = React.useState<Error | null>(null)

  // Fetch apporteurs
  const fetchApporteurs = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    setLoadingApporteurs(true)
    const result = await getApporteursByOrganisation(activeOrganisation.organisationId)
    if (result.data) {
      // Map gRPC Apporteur to Apporteur
      const mapped: Apporteur[] = (result.data.apporteurs || []).map((a) => ({
        id: a.id,
        organisationId: a.organisationId,
        utilisateurId: a.utilisateurId,
        nom: a.nom,
        prenom: a.prenom,
        typeApporteur: a.typeApporteur,
        email: a.email,
        telephone: a.telephone,
        societeId: a.societeId,
        actif: a.actif,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }))
      setApporteurs(mapped)
    }
    setLoadingApporteurs(false)
  }, [activeOrganisation?.organisationId])

  // Fetch baremes
  const fetchBaremes = React.useCallback(async () => {
    if (!activeOrganisation?.organisationId) return
    setLoadingBaremes(true)
    setErrorBaremes(null)
    const result = await getBaremesByOrganisation({ organisationId: activeOrganisation.organisationId })
    if (result.data) {
      setBaremes((result.data.baremes || []) as BaremeWithPaliers[])
    } else if (result.error) {
      setErrorBaremes(new Error(result.error))
    }
    setLoadingBaremes(false)
  }, [activeOrganisation?.organisationId])

  // Fetch data when dialog opens
  React.useEffect(() => {
    if (open && activeOrganisation?.organisationId) {
      fetchApporteurs()
      fetchBaremes()
    }
  }, [open, activeOrganisation?.organisationId, fetchApporteurs, fetchBaremes])

  const handleCreateApporteur = async (data: CreateApporteurData) => {
    if (!activeOrganisation) return

    const result = await createApporteurAction({
      organisationId: activeOrganisation.organisationId,
      utilisateurId: "",
      nom: data.nom,
      prenom: data.prenom,
      typeApporteur: data.typeApporteur,
      email: data.email || "",
      telephone: data.telephone || "",
    })

    if (result.data) {
      toast.success(`${result.data.prenom} ${result.data.nom} créé`)
      fetchApporteurs()
    } else {
      toast.error(result.error || "Erreur lors de la création")
    }
  }

  const handleToggleApporteurActive = async (apporteurId: string, active: boolean) => {
    const result = active
      ? await activerApporteur(apporteurId)
      : await desactiverApporteur(apporteurId)

    if (result.data) {
      toast.success(`${result.data.prenom} ${result.data.nom} ${active ? "activé" : "désactivé"}`)
      fetchApporteurs()
    } else {
      toast.error(result.error || "Erreur lors de la modification")
    }
  }

  const handleEditApporteur = (apporteur: Apporteur) => {
    setEditingApporteur(apporteur)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Configuration des commissions
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="apporteurs" className="gap-2">
              <Users className="size-4" />
              Apporteurs
              <Badge variant="secondary" className="ml-1">{apporteurs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="baremes" className="gap-2">
              <Settings className="size-4" />
              Barèmes
              <Badge variant="secondary" className="ml-1">{baremes.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apporteurs" className="flex-1 min-h-0 mt-4 overflow-auto">
            <ApporteursList
              apporteurs={apporteurs}
              typesApporteur={commissionConfig.typesApporteur}
              loading={loadingApporteurs}
              loadingConfig={false}
              onCreate={handleCreateApporteur}
              onEdit={handleEditApporteur}
              onToggleActive={handleToggleApporteurActive}
            />
          </TabsContent>

          <TabsContent value="baremes" className="flex-1 min-h-0 mt-4 overflow-auto">
            {errorBaremes ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  {errorBaremes.message}
                  <Button variant="outline" size="sm" className="ml-4" onClick={fetchBaremes}>
                    Réessayer
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <BaremesList
                baremes={baremes}
                typesCalcul={commissionConfig.typesCalcul}
                typesBase={commissionConfig.typesBase}
                typesApporteur={commissionConfig.typesApporteur}
                typesPalier={commissionConfig.typesPalier || []}
                dureesReprise={commissionConfig.dureesReprise || []}
                loading={loadingBaremes}
                loadingConfig={false}
                onBaremeCreated={fetchBaremes}
                onBaremeUpdated={fetchBaremes}
              />
            )}
           </TabsContent>
         </Tabs>

         {editingApporteur && (
           <Dialog open={!!editingApporteur} onOpenChange={(open) => !open && setEditingApporteur(null)}>
             <DialogContent className="sm:max-w-[500px]">
               <DialogHeader>
                 <DialogTitle>Modifier l'apporteur</DialogTitle>
                 <DialogDescription>
                   Modification de {editingApporteur.prenom} {editingApporteur.nom}
                 </DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                   <Label htmlFor="edit-prenom">Prénom</Label>
                   <Input id="edit-prenom" defaultValue={editingApporteur.prenom} />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="edit-nom">Nom</Label>
                   <Input id="edit-nom" defaultValue={editingApporteur.nom} />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="edit-email">Email</Label>
                   <Input id="edit-email" type="email" defaultValue={editingApporteur.email} />
                 </div>
                 <div className="grid gap-2">
                   <Label htmlFor="edit-telephone">Téléphone</Label>
                   <Input id="edit-telephone" defaultValue={editingApporteur.telephone || ""} />
                 </div>
               </div>
               <DialogFooter>
                 <Button variant="outline" onClick={() => setEditingApporteur(null)}>
                   Annuler
                 </Button>
                 <Button onClick={() => {
                   toast.info("Fonctionnalité de modification à implémenter")
                   setEditingApporteur(null)
                 }}>
                   Enregistrer
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
         )}
       </DialogContent>
     </Dialog>
   )
 }
