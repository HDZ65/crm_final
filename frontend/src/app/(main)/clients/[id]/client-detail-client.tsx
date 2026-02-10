"use client";

import type { ClientBase } from "@proto/clients/clients";
import type { ExpeditionResponse } from "@proto/logistics/logistics";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import {
  createAdresse,
  createClientEntrepriseAction,
  deleteAdresse,
  deleteClient,
  getAdressesByClient,
  getClient,
  getClientEntreprise,
  listConditionsPaiement,
  listEmissionsFacture,
  listFacturationsPar,
  listPeriodesFacturation,
  listTransporteursCompte,
  listTransporteursCompteByOrganisation,
  updateAdresse,
  updateClient,
  updateClientEntrepriseAction,
} from "@/actions/clients";
import { getClientExpeditions } from "@/actions/expeditions";
import { sendEmail } from "@/actions/mailbox";
import { ClientActivites } from "@/components/activites/client-activites";
import { ClientContracts } from "@/components/client-detail/client-contracts";
import { ClientDocuments } from "@/components/client-detail/client-documents";
import { ClientHeader } from "@/components/client-detail/client-header";
import { ClientHistoryTimeline } from "@/components/client-detail/client-history-timeline";
import { ClientInfoAccordion } from "@/components/client-detail/client-info-accordion";
import { ClientPayments } from "@/components/client-detail/client-payments";
import { ClientShipments } from "@/components/client-detail/client-shipments";
import {
  type AdresseItem,
  type EntrepriseInfo,
  type FacturationConfig,
  type OptionItem,
  type PieceJointeItem,
  type TransporteurItem,
} from "@/components/client-detail/client-sub-entities";
import { ClientTaches } from "@/components/client-detail/client-taches";
import { CreateContratDialog } from "@/components/create-contrat-dialog";
import {
  type EmailAccount,
  EmailAccountSelectorDialog,
} from "@/components/email-account-selector-dialog";
import { EmailComposerDialog } from "@/components/email-composer-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StatutClient } from "@/constants/statuts-client";
import { formatDateFr, formatFullName } from "@/lib/formatters";
import type {
  BankInfo,
  ClientDetail,
  ClientInfo,
  ClientStatus,
  ComplianceInfo,
  Document,
  DocumentDto,
  EventItem,
  PaiementDto,
  Payment,
  Shipment,
  ShipmentStatus,
} from "@/lib/ui/display-types/client";
import type {
  Contract,
  ContratSimpleDto as ContratDto,
} from "@/lib/ui/display-types/contract";

// Type pour les états d'expédition
type ExpeditionEtat =
  | "en_attente"
  | "pris_en_charge"
  | "en_transit"
  | "en_livraison"
  | "livre"
  | "echec_livraison"
  | "retourne";

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
      {
        icon: Calendar,
        label: "Création du contrat",
        date: new Date(contrat.dateDebut).toLocaleDateString("fr-FR"),
      },
    ],
  };
}

// Fonction pour mapper les paiements DTO vers le format attendu
function mapPaiementToPayment(paiement: PaiementDto): Payment {
  return {
    label: paiement.reference,
    date: new Date(paiement.datePaiement).toLocaleDateString("fr-FR"),
    amount: `${paiement.montant.toFixed(2)} ${paiement.devise}`,
    status: paiement.statut,
  };
}

// Fonction pour mapper les documents DTO vers le format attendu
function mapDocumentToDocument(doc: DocumentDto): Document {
  return {
    name: doc.nom,
    type: doc.type,
    updated: new Date(doc.dateUpload).toLocaleDateString("fr-FR"),
    url: doc.url,
  };
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
};

// Fonction pour mapper une expédition gRPC vers Shipment
function mapExpeditionToShipment(expedition: ExpeditionResponse): Shipment {
  return {
    id: expedition.id,
    trackingNumber: expedition.trackingNumber,
    status:
      EXPEDITION_ETAT_TO_STATUS[expedition.etat as ExpeditionEtat] || "pending",
    recipientName: "Destinataire",
    recipientAddress:
      `${expedition.adresseDestination || ""}, ${expedition.codePostalDestination || ""} ${expedition.villeDestination || ""}`.trim(),
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
      ? [
          {
            date: expedition.dateDernierStatut
              ? new Date(expedition.dateDernierStatut).toLocaleDateString(
                  "fr-FR",
                )
              : new Date().toLocaleDateString("fr-FR"),
            status: expedition.etat,
            location: expedition.lieuActuel,
            description: expedition.lieuActuel,
          },
        ]
      : [],
    contractRef: undefined,
  };
}

// Mapper le statut vers un type UI
function mapStatutToStatus(
  statutId: string,
  statutsMap: Map<string, string>,
): ClientStatus {
  const code = (statutsMap.get(statutId) || statutId).toLowerCase();
  if (code === "actif" || code === "active") return "Actif";
  if (code === "impaye" || code === "impayé") return "Impaye";
  if (code === "suspendu" || code === "suspended") return "Suspendu";
  return "Actif";
}

// Mapper ClientBase gRPC vers ClientDetail frontend
function mapClientBaseToDetail(
  client: ClientBase,
  statutsMap: Map<string, string>,
): ClientDetail {
  const name = formatFullName(client.nom, client.prenom);
  const status = mapStatutToStatus(client.statut, statutsMap);

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
      birthDate: client.dateNaissance
        ? formatDateFr(client.dateNaissance)
        : "Non renseigné",
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
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function getString(value: unknown, key: string): string {
  const record = asRecord(value);
  const candidate = record[key];
  return typeof candidate === "string" ? candidate : "";
}

function getBoolean(value: unknown, key: string, fallback = false): boolean {
  const record = asRecord(value);
  const candidate = record[key];
  return typeof candidate === "boolean" ? candidate : fallback;
}

function getFirstArray(value: unknown): Record<string, unknown>[] {
  const record = asRecord(value);
  const found = Object.values(record).find(Array.isArray);
  return Array.isArray(found) ? (found as Record<string, unknown>[]) : [];
}

function mapOptionItems(data: unknown): OptionItem[] {
  return getFirstArray(data).map((item) => ({
    id: getString(item, "id"),
    code: getString(item, "code"),
    nom:
      getString(item, "nom") ||
      getString(item, "name") ||
      getString(item, "code"),
    description: getString(item, "description"),
  }));
}

interface ClientDetailClientProps {
  clientId: string;
  initialClient: ClientBase | null;
  initialExpeditions: ExpeditionResponse[];
  statuts: readonly StatutClient[] | StatutClient[];
}

export function ClientDetailClient({
  clientId,
  initialClient,
  initialExpeditions,
  statuts,
}: ClientDetailClientProps) {
  const router = useRouter();

  // Map statuts for quick lookup
  const statutsMap = React.useMemo(() => {
    const map = new Map<string, string>();
    statuts.forEach((s) => {
      map.set(s.id, s.code);
    });
    return map;
  }, [statuts]);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [createContratOpen, setCreateContratOpen] = React.useState(false);

  // State pour les données
  const [client, setClient] = React.useState<ClientDetail | null>(
    initialClient ? mapClientBaseToDetail(initialClient, statutsMap) : null,
  );
  const [rawClient, setRawClient] = React.useState<ClientBase | null>(
    initialClient,
  );
  const [expeditions, setExpeditions] =
    React.useState<ExpeditionResponse[]>(initialExpeditions);
  const [_loading, setLoading] = React.useState(!initialClient);
  const [_expeditionsLoading, setExpeditionsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [subEntitySaving, setSubEntitySaving] = React.useState(false);
  const [addresses, setAddresses] = React.useState<AdresseItem[]>([]);
  const [entreprise, setEntreprise] = React.useState<EntrepriseInfo | null>(
    null,
  );
  const [conditionsPaiement, setConditionsPaiement] = React.useState<
    OptionItem[]
  >([]);
  const [emissionsFacture, setEmissionsFacture] = React.useState<OptionItem[]>(
    [],
  );
  const [facturationsPar, setFacturationsPar] = React.useState<OptionItem[]>(
    [],
  );
  const [periodesFacturation, setPeriodesFacturation] = React.useState<
    OptionItem[]
  >([]);
  const [transporteurs, setTransporteurs] = React.useState<TransporteurItem[]>(
    [],
  );

  // Fetch du client (pour refresh)
  const fetchClient = React.useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    const result = await getClient(clientId);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setClient(mapClientBaseToDetail(result.data, statutsMap));
      setRawClient(result.data);
    }

    setLoading(false);
  }, [clientId, statutsMap]);

  // Fetch des expéditions (pour refresh)
  const fetchExpeditions = React.useCallback(async () => {
    if (!clientId) return;

    setExpeditionsLoading(true);

    const result = await getClientExpeditions(clientId);

    if (result.data) {
      setExpeditions(result.data.expeditions);
    }

    setExpeditionsLoading(false);
  }, [clientId]);

  const fetchSubEntities = React.useCallback(async () => {
    const [
      addressesResult,
      conditionsResult,
      emissionsResult,
      facturationsResult,
      periodesResult,
    ] = await Promise.all([
      getAdressesByClient(clientId),
      listConditionsPaiement(),
      listEmissionsFacture(),
      listFacturationsPar(),
      listPeriodesFacturation(),
    ]);

    setAddresses(
      getFirstArray(addressesResult.data).map((item) => ({
        id: getString(item, "id"),
        type: getString(item, "type"),
        ligne1: getString(item, "ligne1"),
        ligne2: getString(item, "ligne2"),
        codePostal: getString(item, "codePostal"),
        ville: getString(item, "ville"),
        pays: getString(item, "pays"),
      })),
    );

    setConditionsPaiement(mapOptionItems(conditionsResult.data));
    setEmissionsFacture(mapOptionItems(emissionsResult.data));
    setFacturationsPar(mapOptionItems(facturationsResult.data));
    setPeriodesFacturation(mapOptionItems(periodesResult.data));

    const raw = asRecord(rawClient);
    const candidateEntrepriseIds = [
      getString(raw, "clientEntrepriseId"),
      getString(raw, "entrepriseId"),
      clientId,
    ].filter(Boolean);

    let entrepriseData: EntrepriseInfo | null = null;
    for (const id of candidateEntrepriseIds) {
      const entrepriseResult = await getClientEntreprise(id);
      if (entrepriseResult.data) {
        const item = asRecord(entrepriseResult.data);
        entrepriseData = {
          id: getString(item, "id"),
          raisonSociale: getString(item, "raisonSociale"),
          numeroTva: getString(item, "numeroTva"),
          siren: getString(item, "siren"),
        };
        break;
      }
    }
    setEntreprise(entrepriseData);

    const organisationId = getString(raw, "organisationId");
    const transporteursResult = organisationId
      ? await listTransporteursCompteByOrganisation({ organisationId })
      : await listTransporteursCompte({ actif: true });

    setTransporteurs(
      getFirstArray(transporteursResult.data).map((item) => ({
        id: getString(item, "id"),
        type: getString(item, "type"),
        contractNumber: getString(item, "contractNumber"),
        labelFormat: getString(item, "labelFormat"),
        actif: getBoolean(item, "actif", true),
      })),
    );
  }, [clientId, rawClient]);

  // Refetch tout
  const refetch = React.useCallback(() => {
    fetchClient();
    fetchExpeditions();
    fetchSubEntities();
  }, [fetchClient, fetchExpeditions, fetchSubEntities]);

  const [selectedRef, setSelectedRef] = React.useState<string>("");
  const [accountSelectorOpen, setAccountSelectorOpen] = React.useState(false);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [selectedEmailAccount, setSelectedEmailAccount] =
    React.useState<EmailAccount | null>(null);

  // Mapper les contrats vers le format attendu
  const contracts = React.useMemo(() => {
    if (!client?.contracts) return [];
    return client.contracts.map(mapContratToContract);
  }, [client?.contracts]);

  // Sélectionner le premier contrat par défaut
  React.useEffect(() => {
    if (contracts.length > 0 && !selectedRef) {
      setSelectedRef(contracts[0].ref);
    }
  }, [contracts, selectedRef]);

  React.useEffect(() => {
    fetchSubEntities();
  }, [fetchSubEntities]);

  const selected = React.useMemo(
    () => contracts.find((c) => c.ref === selectedRef) ?? contracts[0],
    [contracts, selectedRef],
  );

  const parseFrDate = React.useCallback((d: string) => {
    const [dd, mm, yyyy] = d.split("/").map(Number);
    return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
  }, []);

  const selectedHistory = React.useMemo(() => {
    const list = selected?.history ?? [];
    return [...list].sort((a, b) => parseFrDate(b.date) - parseFrDate(a.date));
  }, [selected, parseFrDate]);

  const allHistory = React.useMemo(() => {
    const arr = contracts.flatMap((c) =>
      c.history.map((h) => ({ ...h, ref: c.ref }) as EventItem),
    );
    return arr.sort((a, b) => parseFrDate(b.date) - parseFrDate(a.date));
  }, [contracts, parseFrDate]);

  // Mapper les paiements DTO vers le format UI
  const payments = React.useMemo(() => {
    if (!client?.payments) return [];
    return client.payments.map(mapPaiementToPayment);
  }, [client?.payments]);

  // Mapper les documents DTO vers le format UI
  const documents = React.useMemo(() => {
    if (!client?.documents) return [];
    return client.documents.map(mapDocumentToDocument);
  }, [client?.documents]);

  // Mapper les expéditions
  const shipments = React.useMemo(() => {
    return expeditions.map(mapExpeditionToShipment);
  }, [expeditions]);

  // Extraire les infos du client
  const clientInfo: ClientInfo | null = client ? client.info : null;
  const complianceInfo: ComplianceInfo | null = client
    ? client.compliance
    : null;
  const bankInfo: BankInfo | null = client ? client.bank : null;
  const raw = asRecord(rawClient);
  const selectedConditionPaiementId = getString(raw, "conditionPaiementId");
  const selectedTransporteurCompteId = getString(raw, "transporteurCompteId");
  const facturationConfig: FacturationConfig = {
    emissionFactureId: getString(raw, "emissionFactureId"),
    facturationParId: getString(raw, "facturationParId"),
    periodeFacturationId: getString(raw, "periodeFacturationId"),
  };
  const piecesJointes: PieceJointeItem[] = (client?.documents ?? []).map(
    (doc, index) => ({
      id: `${doc.nom}-${index}`,
      nom: doc.nom,
      type: doc.type,
      dateUpload: formatDateFr(doc.dateUpload),
      url: doc.url,
    }),
  );

  // Fonction pour mettre à jour un champ du client
  const handleUpdateField = React.useCallback(
    async (field: string, value: string) => {
      const result = await updateClient({ id: clientId, [field]: value });
      if (result.error) {
        toast.error(result.error);
      } else {
        refetch();
      }
    },
    [clientId, refetch],
  );

  const withSubEntitySaving = React.useCallback(
    async (work: () => Promise<void>) => {
      setSubEntitySaving(true);
      try {
        await work();
      } finally {
        setSubEntitySaving(false);
      }
    },
    [],
  );

  const handleCreateAddress = React.useCallback(
    async (payload: Omit<AdresseItem, "id">) => {
      await withSubEntitySaving(async () => {
        const result = await createAdresse({
          clientBaseId: clientId,
          ...payload,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Adresse créée");
        await fetchSubEntities();
      });
    },
    [clientId, fetchSubEntities, withSubEntitySaving],
  );

  const handleUpdateAddress = React.useCallback(
    async (id: string, payload: Omit<AdresseItem, "id">) => {
      await withSubEntitySaving(async () => {
        const result = await updateAdresse({ id, ...payload });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Adresse mise à jour");
        await fetchSubEntities();
      });
    },
    [fetchSubEntities, withSubEntitySaving],
  );

  const handleDeleteAddress = React.useCallback(
    async (id: string) => {
      await withSubEntitySaving(async () => {
        const result = await deleteAdresse(id);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Adresse supprimée");
        await fetchSubEntities();
      });
    },
    [fetchSubEntities, withSubEntitySaving],
  );

  const handleSaveEntreprise = React.useCallback(
    async (payload: EntrepriseInfo) => {
      await withSubEntitySaving(async () => {
        const result = payload.id
          ? await updateClientEntrepriseAction({
              id: payload.id,
              raisonSociale: payload.raisonSociale,
              numeroTva: payload.numeroTva,
              siren: payload.siren,
            })
          : await createClientEntrepriseAction({
              raisonSociale: payload.raisonSociale,
              numeroTva: payload.numeroTva,
              siren: payload.siren,
            });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        const entrepriseId = getString(result.data, "id");
        if (entrepriseId && !payload.id) {
          await updateClient({
            id: clientId,
            clientEntrepriseId: entrepriseId,
          } as Parameters<typeof updateClient>[0]);
        }

        toast.success("Informations entreprise enregistrées");
        refetch();
      });
    },
    [clientId, refetch, withSubEntitySaving],
  );

  const handleSaveConditionPaiement = React.useCallback(
    async (id: string) => {
      await withSubEntitySaving(async () => {
        await handleUpdateField("conditionPaiementId", id);
        toast.success("Condition de paiement enregistrée");
      });
    },
    [handleUpdateField, withSubEntitySaving],
  );

  const handleSaveFacturationConfig = React.useCallback(
    async (payload: FacturationConfig) => {
      await withSubEntitySaving(async () => {
        const result = await updateClient({
          id: clientId,
          emissionFactureId: payload.emissionFactureId,
          facturationParId: payload.facturationParId,
          periodeFacturationId: payload.periodeFacturationId,
        } as Parameters<typeof updateClient>[0]);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        toast.success("Configuration de facturation enregistrée");
        refetch();
      });
    },
    [clientId, refetch, withSubEntitySaving],
  );

  const handleSaveTransporteur = React.useCallback(
    async (id: string) => {
      await withSubEntitySaving(async () => {
        const result = await updateClient({
          id: clientId,
          transporteurCompteId: id,
        } as Parameters<typeof updateClient>[0]);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Transporteur enregistré");
        refetch();
      });
    },
    [clientId, refetch, withSubEntitySaving],
  );

  // Fonction pour copier les infos du client
  const handleCopyClientInfo = React.useCallback(() => {
    if (!client) return;
    const info = `${client.name}
Email: ${client.info.email}
Téléphone: ${client.info.phone}
Adresse: ${client.info.address}`;
    navigator.clipboard.writeText(info);
    toast.success("Informations copiées dans le presse-papier");
  }, [client]);

  // Fonction pour supprimer le client
  const handleDeleteClient = React.useCallback(async () => {
    setIsDeleting(true);
    const result = await deleteClient(clientId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Client supprimé avec succès");
      router.push("/clients");
    }
    setIsDeleting(false);
    setDeleteDialogOpen(false);
  }, [clientId, router]);

  // Fonction pour ouvrir la modale d'édition (scroll vers le dossier client)
  const handleEditClick = React.useCallback(() => {
    const accordion = document.querySelector('[data-slot="accordion"]');
    accordion?.scrollIntoView({ behavior: "smooth" });
    toast.info("Cliquez sur un champ pour le modifier");
  }, []);

  const handleEmailAccountSelect = (account: EmailAccount) => {
    setSelectedEmailAccount(account);
    setAccountSelectorOpen(false);
    setComposerOpen(true);
  };

  const handleSendEmail = async (data: {
    to: string;
    cc?: string;
    subject: string;
    body: string;
    from: EmailAccount;
  }) => {
    try {
      // Extract mailbox ID from the email account
      // The EmailAccount type should have an id field that corresponds to the mailbox ID
      const mailboxId = data.from.id;

      if (!mailboxId) {
        toast.error("Erreur: Compte email invalide");
        return;
      }

      // Call the server action to send email
      const result = await sendEmail({
        mailboxId,
        to: data.to,
        cc: data.cc,
        subject: data.subject,
        body: data.body,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Email envoyé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'envoi de l'email",
      );
    }
  };

  const handleAddEmailAccount = (newAccount: Omit<EmailAccount, "id">) => {
    console.log("Nouveau compte email à ajouter:", newAccount);
    // TODO: Sauvegarder le nouveau compte dans votre base de données
  };

  // Affichage de l'erreur
  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Erreur lors du chargement du client</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </main>
    );
  }

  // Si pas de client trouvé
  if (!client) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Client non trouvé</p>
      </main>
    );
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

        <Tabs
          defaultValue="overview"
          className="w-full gap-4 flex-1 flex flex-col h-full"
        >
           <TabsList>
             <TabsTrigger value="overview">
               Infos générales & Contrats
             </TabsTrigger>

             <TabsTrigger value="paiements-expeditions">Paiements & Expéditions</TabsTrigger>
             <TabsTrigger value="activites-taches">Activités & Tâches</TabsTrigger>
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
              <ClientHistoryTimeline
                contractRef={selected?.ref}
                history={selectedHistory}
              />
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



           <TabsContent value="activites-taches" className="flex-1 flex flex-col gap-6">
             <div className="space-y-4">
               <h3 className="text-lg font-semibold">Activités</h3>
               <ClientActivites clientId={clientId} />
             </div>
             <div className="border-t pt-6 space-y-4">
               <h3 className="text-lg font-semibold">Tâches</h3>
               <ClientTaches clientId={clientId} />
             </div>
           </TabsContent>

           <TabsContent value="paiements-expeditions" className="flex-1 flex flex-col gap-6">
             <div className="space-y-4">
               <h3 className="text-lg font-semibold">Paiements & Échéanciers</h3>
               <ClientPayments
                 payments={payments}
                 balance={client.balance}
                 balanceStatus={client.balanceStatus}
               />
             </div>
             <div className="border-t pt-6 space-y-4">
               <h3 className="text-lg font-semibold">Expéditions & Colis</h3>
               <ClientShipments
                 shipments={shipments}
                 onCreateShipment={() =>
                   console.log("Créer une nouvelle expédition")
                 }
               />
             </div>
           </TabsContent>

          <TabsContent value="documents" className="flex-1 flex flex-col">
            <ClientDocuments
              documents={documents}
              onAddDocument={() => console.log("Ajouter un document")}
              onDownloadDocument={(doc) =>
                console.log("Télécharger:", doc.name)
              }
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
          setComposerOpen(false);
          setAccountSelectorOpen(true);
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
              Êtes-vous sûr de vouloir supprimer <strong>{client.name}</strong>{" "}
              ? Cette action est irréversible et supprimera toutes les données
              associées.
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
  );
}
