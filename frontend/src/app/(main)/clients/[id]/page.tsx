"use client"

import * as React from "react"
import { useParams } from "next/navigation"
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
import { useClient, type ContratDto, type PaiementDto, type DocumentDto } from "@/hooks/clients"
import { useClientExpeditions, type ExpeditionDto, type ExpeditionEtat } from "@/hooks/logistics"
import { useOrganisation } from "@/contexts/organisation-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "lucide-react"
import type { EventItem, Contract, Payment, Document, ClientInfo, ComplianceInfo, BankInfo, Shipment, ShipmentStatus } from "@/types/client"

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

// Fonction pour mapper les paiements de l'API vers le format attendu
function mapPaiementToPayment(paiement: PaiementDto): Payment {
  return {
    label: paiement.reference,
    date: new Date(paiement.datePaiement).toLocaleDateString("fr-FR"),
    amount: `${paiement.montant.toFixed(2)} ${paiement.devise}`,
    status: paiement.statut,
  }
}

// Fonction pour mapper les documents de l'API vers le format attendu
function mapDocumentToDocument(doc: DocumentDto): Document {
  return {
    name: doc.nom,
    type: doc.type,
    updated: new Date(doc.dateUpload).toLocaleDateString("fr-FR"),
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

// Fonction pour mapper une expédition API vers Shipment
function mapExpeditionToShipment(expedition: ExpeditionDto): Shipment {
  return {
    id: expedition.id,
    trackingNumber: expedition.trackingNumber,
    status: EXPEDITION_ETAT_TO_STATUS[expedition.etat] || "pending",
    recipientName: expedition.client
      ? `${expedition.client.nom} ${expedition.client.prenom}`.trim()
      : "Destinataire inconnu",
    recipientAddress: `${expedition.adresseDestination}, ${expedition.codePostalDestination} ${expedition.villeDestination}`,
    senderName: undefined, // Non fourni par l'API
    senderAddress: undefined, // Non fourni par l'API
    product: expedition.nomProduit,
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
    contractRef: expedition.contrat?.referenceExterne,
  }
}

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string

  const { currentOrganisation } = useOrganisation()
  const organisationId = currentOrganisation?.id || null

  const { client, loading, error } = useClient(clientId)
  const { expeditions, loading: expeditionsLoading } = useClientExpeditions(organisationId, clientId)

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

  // Mapper les paiements
  const payments = React.useMemo(() => {
    if (!client?.payments) return []
    return client.payments.map(mapPaiementToPayment)
  }, [client?.payments])

  // Mapper les documents
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

  // Affichage du loading state
  if (loading) {
    return (
      <main className="flex flex-1 flex-col gap-4 min-h-0">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 flex-1">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </main>
    )
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Erreur lors du chargement du client</p>
        <p className="text-muted-foreground text-sm">{error.message}</p>
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
          onNewContractClick={() => console.log("Nouveau contrat")}
        />

        <Tabs defaultValue="overview" className="w-full gap-4 flex-1 flex flex-col h-full">
          <TabsList>
            <TabsTrigger value="overview">Infos générales & Contrats</TabsTrigger>
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
              />
            )}
          </TabsContent>

          <TabsContent value="paiements">
            <ClientPayments
              payments={payments}
              balance={client.balance}
              balanceStatus={client.balanceStatus}
            />
          </TabsContent>

          <TabsContent value="expeditions" className="flex-1 flex flex-col">
            {expeditionsLoading ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <Skeleton className="lg:col-span-8 h-64" />
                <Skeleton className="lg:col-span-4 h-64" />
              </div>
            ) : (
              <ClientShipments
                shipments={shipments}
                onCreateShipment={() => console.log("Créer une nouvelle expédition")}
              />
            )}
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
    </>
  )
}
