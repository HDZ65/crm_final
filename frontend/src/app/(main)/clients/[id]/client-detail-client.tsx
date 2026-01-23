"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailAccountSelectorDialog, type EmailAccount } from "@/components/email-account-selector-dialog"
import { EmailComposerDialog } from "@/components/email-composer-dialog"
import { ClientHeader } from "@/components/client-detail/client-header"
import { ClientContracts } from "@/components/client-detail/client-contracts"
import { ClientHistoryTimeline } from "@/components/client-detail/client-history-timeline"
import { ClientInfoAccordion } from "@/components/client-detail/client-info-accordion"
import { ClientPayments } from "@/components/client-detail/client-payments"
import { ClientDocuments } from "@/components/client-detail/client-documents"
import { ClientShipments } from "@/components/client-detail/client-shipments"
import { ClientActivites } from "@/components/activites/client-activites"
import { getClient, updateClient, deleteClient } from "@/actions/clients"
import { getClientExpeditions } from "@/actions/expeditions"
import type { ClientBase } from "@proto/clients/clients"
import type { ExpeditionResponse } from "@proto/logistics/logistics"
import type { StatutClient } from "@/constants/statuts-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { CreateContratDialog } from "@/components/create-contrat-dialog"
import { Calendar } from "lucide-react"
import { formatFullName, formatDateFr } from "@/lib/formatters"
import type { EventItem, Contract, Payment, Document, ClientInfo, ComplianceInfo, BankInfo, Shipment, ShipmentStatus, ClientDetail } from "@/types/client"
import type { ContratSimpleDto as ContratDto } from "@/types/contract"

// Type pour les états d'expédition
type ExpeditionEtat = "en_attente" | "pris_en_charge" | "en_transit" | "en_livraison" | "livre" | "echec_livraison" | "retourne"

// Fonction pour mapper les contrats de l'API vers le format attendu par les composants
function mapContratToContract(contrat: ContratDto): Contract {
  return {
    ref: contrat.referenceExterne,
    product: "Produit", // TODO: Récupérer depuis l'API
    status: contrat.statutId ? "Actif" : "Inactif",
    start: new Date(contrat.dateDebut).toLocaleDateString("fr-FR"),
    pay: "SEPA", // TODO: Récupérer depuis l'API
    sales: "Commercial", // TODO: Récupérer depuis l'API
    history: [
      { icon: Calendar, label: "Création du contrat", date: new Date(contrat.dateDebut).toLocaleDateString("fr-FR") },
    ],
  }
}

// Fonction pour mapper les paiements DTO vers le format attendu
function mapPaiementToPayment(paiement: import("@/types/client").PaiementDto): Payment {
  return {
    label: paiement.reference,
    date: new Date(paiement.datePaiement).toLocaleDateString("fr-FR"),
    amount: `${paiement.montant.toFixed(2)} ${paiement.devise}`,
    status: paiement.statut,
  }
}

// Fonction pour mapper les documents DTO vers le format attendu
function mapDocumentToDocument(doc: import("@/types/client").DocumentDto): Document {
  return {
    name: doc.nom,
    type: doc.type,
    updated: new Date(doc.dateUpload).toLocaleDateString("fr-FR"),
    url: doc.url,
  }
}

// Mapping des états API vers les statuts UI pour les expéditions
const EXPEDITION_ETAT_TO_STATUS: Record<ExpeditionEtat, ShipmentStatus> = {
  en_attente: "pending",
  pris_en_charge: "pending",
  en_transit: "in_transit",
  en_livraison: "out_for_delivery",
  livre: "delivered",
  echec_livraison: "failed",
  retourne: "returned",
}

// Fonction pour mapper une expédition gRPC vers Shipment
function mapExpeditionToShipment(expedition: ExpeditionResponse): Shipment {
  return {
    id: expedition.id,
    trackingNumber: expedition.trackingNumber,
    status: EXPEDITION_ETAT_TO_STATUS[expedition.etat as ExpeditionEtat] || "pending",
    recipientName: "Destinataire",
    recipientAddress: `${expedition.adresseDestination || ""}, ${expedition.codePostalDestination || ""} ${expedition.villeDestination || ""}`.trim(),
    senderName: undefined,
    senderAddress: undefined,
    product: expedition.nomProduit || "Produit inconnu",
    weight: expedition.poids || undefined,
    createdAt: new Date(expedition.dateCreation).toLocaleDateString("fr-FR"),
    estimatedDelivery: expedition.dateLivraisonEstimee
      ? new Date(expedition.dateLivraisonEstimee).toLocaleDateString("fr-FR")
      : undefined,
    deliveredAt: expedition.dateLivraison
      ? new Date(expedition.dateLivraison).toLocaleDateString("fr-FR")
      : undefined,
    events: expedition.lieuActuel
      ? [{
          date: expedition.dateDernierStatut
            ? new Date(expedition.dateDernierStatut).toLocaleDateString("fr-FR")
            : new Date().toLocaleDateString("fr-FR"),
          status: expedition.etat,
          location: expedition.lieuActuel,
          description: expedition.lieuActuel,
        }]
      : [],
    contractRef: undefined,
  }
}

// Mapper le statut vers un type UI
function mapStatutToStatus(statutId: string, statutsMap: Map<string, string>): "Actif" | "Impayé" | "Suspendu" {
  const code = (statutsMap.get(statutId) || statutId).toLowerCase()
  if (code === 'actif' || code === 'active') return 'Actif'
  if (code === 'impaye' || code === 'impayé') return 'Impayé'
  if (code === 'suspendu' || code === 'suspended') return 'Suspendu'
  return 'Actif'
}

// Mapper ClientBase gRPC vers ClientDetail frontend
function mapClientBaseToDetail(client: ClientBase, statutsMap: Map<string, string>): ClientDetail {
  const name = formatFullName(client.nom, client.prenom)
  const status = mapStatutToStatus(client.statut, statutsMap)

  return {
    id: client.id,
    name,
    status,
    location: "Non renseigné",
    memberSince: new Date(client.createdAt).getFullYear().toString(),
    info: {
      nom: client.nom || "Non renseigné",
      prenom: client.prenom || "Non renseigné",
      profession: "Non renseigné",
      phone: client.telephone || "Non renseigné",
      birthDate: client.dateNaissance ? formatDateFr(client.dateNaissance) : "Non renseigné",
      email: client.email || "Non renseigné",
      address: "Non renseigné",
    },
    compliance: {
      kycStatus: "Non renseigné",
      kycStatusVariant: "warning" as const,
      gdprConsent: "Non renseigné",
      gdprConsentVariant: "warning" as const,
      language: "Français",
    },
    bank: {
      iban: "Non renseigné",
      sepaMandateStatus: "Inactif",
      sepaMandateStatusVariant: "error" as const,
    },
    contracts: [],
    payments: [],
    documents: [],
    events: [],
    balance: "0.00 EUR",
    balanceStatus: "À jour",
  }
}

interface ClientDetailClientProps {
  clientId: string
  initialClient: ClientBase | null
  initialExpeditions: ExpeditionResponse[]
  statuts: readonly StatutClient[] | StatutClient[]
}

export function ClientDetailClient({
  clientId,
  initialClient,
  initialExpeditions,
  statuts,
}: ClientDetailClientProps) {
  const router = useRouter()

  // Map statuts for quick lookup
  const statutsMap = React.useMemo(() => {
    const map = new Map<string, string>()
    statuts.forEach(s => map.set(s.id, s.code))
    return map
  }, [statuts])

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [createContratOpen, setCreateContratOpen] = React.useState(false)

  // State pour les données
  const [client, setClient] = React.useState<ClientDetail | null>(
    initialClient ? mapClientBaseToDetail(initialClient, statutsMap) : null
  )
  const [expeditions, setExpeditions] = React.useState<ExpeditionResponse[]>(initialExpeditions)
  const [loading, setLoading] = React.useState(!initialClient)
  const [expeditionsLoading, setExpeditionsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch du client (pour refresh)
  const fetchClient = React.useCallback(async () => {
    if (!clientId) return

    setLoading(true)
    setError(null)

    const result = await getClient(clientId)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setClient(mapClientBaseToDetail(result.data, statutsMap))
    }

    setLoading(false)
  }, [clientId, statutsMap])

  // Fetch des expéditions (pour refresh)
  const fetchExpeditions = React.useCallback(async () => {
    if (!clientId) return

    setExpeditionsLoading(true)

    const result = await getClientExpeditions(clientId)

    if (result.data) {
      setExpeditions(result.data.expeditions)
    }

    setExpeditionsLoading(false)
  }, [clientId])

  // Refetch tout
  const refetch = React.useCallback(() => {
    fetchClient()
    fetchExpeditions()
  }, [fetchClient, fetchExpeditions])

  const [selectedRef, setSelectedRef] = React.useState<string>("")
  const [accountSelectorOpen, setAccountSelectorOpen] = React.useState(false)
  const [composerOpen, setComposerOpen] = React.useState(false)
  const [selectedEmailAccount, setSelectedEmailAccount] = React.useState<EmailAccount | null>(null)

  // Mapper les contrats vers le format attendu
  const contracts = React.useMemo(() => {
    if (!client?.contracts) return []
    return client.contracts.map(mapContratToContract)
  }, [client?.contracts])

  // Sélectionner le premier contrat par défaut
  React.useEffect(() => {
    if (contracts.length > 0 && !selectedRef) {
      setSelectedRef(contracts[0].ref)
    }
  }, [contracts, selectedRef])

  const selected = React.useMemo(
    () => contracts.find((c) => c.ref === selectedRef) ?? contracts[0],
    [contracts, selectedRef]
  )

  function parseFrDate(d: string) {
    const [dd, mm, yyyy] = d.split("/").map(Number)
    return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime()
  }

  const selectedHistory = React.useMemo(() => {
    const list = selected?.history ?? []
    return [...list].sort((a, b) => parseFrDate(b.date) - parseFrDate(a.date))
  }, [selected])

  const allHistory = React.useMemo(() => {
    const arr = contracts.flatMap((c) =>
      c.history.map((h) => ({ ...h, ref: c.ref } as EventItem))
    )
    return arr.sort((a, b) => parseFrDate(b.date) - parseFrDate(a.date))
  }, [contracts])

  // Mapper les paiements DTO vers le format UI
  const payments = React.useMemo(() => {
    if (!client?.payments) return []
    return client.payments.map(mapPaiementToPayment)
  }, [client?.payments])

  // Mapper les documents DTO vers le format UI
  const documents = React.useMemo(() => {
    if (!client?.documents) return []
    return client.documents.map(mapDocumentToDocument)
  }, [client?.documents])

  // Mapper les expéditions
  const shipments = React.useMemo(() => {
    return expeditions.map(mapExpeditionToShipment)
  }, [expeditions])

  // Extraire les infos du client
  const clientInfo: ClientInfo | null = client ? client.info : null
  const complianceInfo: ComplianceInfo | null = client ? client.compliance : null
  const bankInfo: BankInfo | null = client ? client.bank : null

  // Fonction pour mettre à jour un champ du client
  const handleUpdateField = React.useCallback(async (field: string, value: string) => {
    const result = await updateClient({ id: clientId, [field]: value })
    if (result.error) {
      toast.error(result.error)
    } else {
      refetch()
    }
  }, [clientId, refetch])

  // Fonction pour copier les infos du client
  const handleCopyClientInfo = React.useCallback(() => {
    if (!client) return
    const info = `${client.name}
Email: ${client.info.email}
Téléphone: ${client.info.phone}
Adresse: ${client.info.address}`
    navigator.clipboard.writeText(info)
    toast.success("Informations copiées dans le presse-papier")
  }, [client])

  // Fonction pour supprimer le client
  const handleDeleteClient = React.useCallback(async () => {
    setIsDeleting(true)
    const result = await deleteClient(clientId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Client supprimé avec succès")
      router.push("/clients")
    }
    setIsDeleting(false)
    setDeleteDialogOpen(false)
  }, [clientId, router])

  // Fonction pour ouvrir la modale d'édition (scroll vers le dossier client)
  const handleEditClick = React.useCallback(() => {
    const accordion = document.querySelector('[data-slot="accordion"]')
    accordion?.scrollIntoView({ behavior: "smooth" })
    toast.info("Cliquez sur un champ pour le modifier")
  }, [])

  const handleEmailAccountSelect = (account: EmailAccount) => {
    setSelectedEmailAccount(account)
    setAccountSelectorOpen(false)
    setComposerOpen(true)
  }

  const handleSendEmail = (data: {
    to: string
    cc?: string
    subject: string
    body: string
    from: EmailAccount
  }) => {
    console.log("Envoi d'email:", data)
    // TODO: Appeler votre API pour envoyer l'email
  }

  const handleAddEmailAccount = (newAccount: Omit<EmailAccount, "id">) => {
    console.log("Nouveau compte email à ajouter:", newAccount)
    // TODO: Sauvegarder le nouveau compte dans votre base de données
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Erreur lors du chargement du client</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </main>
    )
  }

  // Si pas de client trouvé
  if (!client) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Client non trouvé</p>
      </main>
    )
  }

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 min-h-0">
        <ClientHeader
          clientName={client.name}
          status={`Client ${client.status.toLowerCase()}`}
          location={client.location}
          memberSince={client.memberSince}
          allHistory={allHistory}
          onEmailClick={() => setAccountSelectorOpen(true)}
          onNewContractClick={() => setCreateContratOpen(true)}
          onEditClick={handleEditClick}
          onDeleteClick={() => setDeleteDialogOpen(true)}
          onCopyClick={handleCopyClientInfo}
        />

        <Tabs defaultValue="overview" className="w-full gap-4 flex-1 flex flex-col h-full">
<TabsList>
            <TabsTrigger value="overview">Infos générales & Contrats</TabsTrigger>
            <TabsTrigger value="activites">Activités</TabsTrigger>
            <TabsTrigger value="paiements">Paiements & Échéanciers</TabsTrigger>
            <TabsTrigger value="expeditions">Expéditions & Colis</TabsTrigger>
            <TabsTrigger value="documents">Documents (GED)</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start flex-1"
          >
            <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 h-full">
              <ClientContracts
                contracts={contracts}
                selectedRef={selectedRef}
                onSelectContract={setSelectedRef}
              />
              <ClientHistoryTimeline contractRef={selected?.ref} history={selectedHistory} />
            </div>

            {clientInfo && complianceInfo && bankInfo && (
              <ClientInfoAccordion
                clientInfo={clientInfo}
                compliance={complianceInfo}
                bank={bankInfo}
                onUpdateField={handleUpdateField}
              />
            )}
          </TabsContent>

<TabsContent value="activites" className="flex-1">
            <ClientActivites clientId={clientId} />
          </TabsContent>

          <TabsContent value="paiements">
            <ClientPayments
              payments={payments}
              balance={client.balance}
              balanceStatus={client.balanceStatus}
            />
          </TabsContent>

          <TabsContent value="expeditions" className="flex-1 flex flex-col">
            <ClientShipments
              shipments={shipments}
              onCreateShipment={() => console.log("Créer une nouvelle expédition")}
            />
          </TabsContent>

          <TabsContent value="documents" className="flex-1 flex flex-col">
            <ClientDocuments
              documents={documents}
              onAddDocument={() => console.log("Ajouter un document")}
              onDownloadDocument={(doc) => console.log("Télécharger:", doc.name)}
            />
          </TabsContent>
        </Tabs>
      </main>

      <EmailAccountSelectorDialog
        open={accountSelectorOpen}
        onOpenChange={setAccountSelectorOpen}
        onSelectAccount={handleEmailAccountSelect}
        onAddAccount={handleAddEmailAccount}
      />
      <EmailComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        selectedAccount={selectedEmailAccount}
        onChangeAccount={() => {
          setComposerOpen(false)
          setAccountSelectorOpen(true)
        }}
        defaultTo={client.info.email}
        defaultSubject={`Re: ${client.name}`}
        onSendEmail={handleSendEmail}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{client.name}</strong> ?
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateContratDialog
        open={createContratOpen}
        onOpenChange={setCreateContratOpen}
        onSuccess={() => refetch()}
      />
    </>
  )
}
