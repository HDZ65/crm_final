"use client";

import {
  Building2,
  CreditCard,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  Truck,
} from "lucide-react";
import * as React from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AdresseItem {
  id: string;
  type: string;
  ligne1: string;
  ligne2?: string;
  codePostal: string;
  ville: string;
  pays: string;
}

export interface EntrepriseInfo {
  id?: string;
  raisonSociale: string;
  numeroTva: string;
  siren: string;
}

export interface OptionItem {
  id: string;
  code: string;
  nom: string;
  description?: string;
}

export interface TransporteurItem {
  id: string;
  type: string;
  contractNumber: string;
  labelFormat: string;
  actif: boolean;
}

export interface FacturationConfig {
  emissionFactureId: string;
  facturationParId: string;
  periodeFacturationId: string;
}

export interface PieceJointeItem {
  id: string;
  nom: string;
  type: string;
  dateUpload: string;
  url?: string;
}

interface ClientSubEntitiesProps {
  addresses: AdresseItem[];
  entreprise: EntrepriseInfo | null;
  conditionsPaiement: OptionItem[];
  emissionsFacture: OptionItem[];
  facturationsPar: OptionItem[];
  periodesFacturation: OptionItem[];
  transporteurs: TransporteurItem[];
  selectedConditionPaiementId: string;
  selectedTransporteurCompteId: string;
  facturationConfig: FacturationConfig;
  piecesJointes: PieceJointeItem[];
  saving: boolean;
  onCreateAddress: (payload: Omit<AdresseItem, "id">) => Promise<void>;
  onUpdateAddress: (
    id: string,
    payload: Omit<AdresseItem, "id">,
  ) => Promise<void>;
  onDeleteAddress: (id: string) => Promise<void>;
  onSaveEntreprise: (payload: EntrepriseInfo) => Promise<void>;
  onSaveConditionPaiement: (id: string) => Promise<void>;
  onSaveFacturationConfig: (payload: FacturationConfig) => Promise<void>;
  onSaveTransporteur: (id: string) => Promise<void>;
}

const EMPTY_ADDRESS: Omit<AdresseItem, "id"> = {
  type: "facturation",
  ligne1: "",
  ligne2: "",
  codePostal: "",
  ville: "",
  pays: "France",
};

export function ClientSubEntities({
  addresses,
  entreprise,
  conditionsPaiement,
  emissionsFacture,
  facturationsPar,
  periodesFacturation,
  transporteurs,
  selectedConditionPaiementId,
  selectedTransporteurCompteId,
  facturationConfig,
  piecesJointes,
  saving,
  onCreateAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSaveEntreprise,
  onSaveConditionPaiement,
  onSaveFacturationConfig,
  onSaveTransporteur,
}: ClientSubEntitiesProps) {
  const [addressDialogOpen, setAddressDialogOpen] = React.useState(false);
  const [addressToDelete, setAddressToDelete] =
    React.useState<AdresseItem | null>(null);
  const [editingAddress, setEditingAddress] =
    React.useState<AdresseItem | null>(null);
  const [addressForm, setAddressForm] =
    React.useState<Omit<AdresseItem, "id">>(EMPTY_ADDRESS);

  const [entrepriseForm, setEntrepriseForm] = React.useState<EntrepriseInfo>({
    id: "",
    raisonSociale: "",
    numeroTva: "",
    siren: "",
  });

  const [conditionId, setConditionId] = React.useState(
    selectedConditionPaiementId,
  );
  const [facturationForm, setFacturationForm] =
    React.useState(facturationConfig);
  const [transporteurId, setTransporteurId] = React.useState(
    selectedTransporteurCompteId,
  );

  React.useEffect(() => {
    setConditionId(selectedConditionPaiementId);
  }, [selectedConditionPaiementId]);

  React.useEffect(() => {
    setFacturationForm(facturationConfig);
  }, [facturationConfig]);

  React.useEffect(() => {
    setTransporteurId(selectedTransporteurCompteId);
  }, [selectedTransporteurCompteId]);

  React.useEffect(() => {
    setEntrepriseForm({
      id: entreprise?.id || "",
      raisonSociale: entreprise?.raisonSociale || "",
      numeroTva: entreprise?.numeroTva || "",
      siren: entreprise?.siren || "",
    });
  }, [entreprise]);

  const openCreateAddress = () => {
    setEditingAddress(null);
    setAddressForm(EMPTY_ADDRESS);
    setAddressDialogOpen(true);
  };

  const openEditAddress = (address: AdresseItem) => {
    setEditingAddress(address);
    setAddressForm({
      type: address.type,
      ligne1: address.ligne1,
      ligne2: address.ligne2 || "",
      codePostal: address.codePostal,
      ville: address.ville,
      pays: address.pays,
    });
    setAddressDialogOpen(true);
  };

  const submitAddress = async () => {
    if (editingAddress) {
      await onUpdateAddress(editingAddress.id, addressForm);
    } else {
      await onCreateAddress(addressForm);
    }
    setAddressDialogOpen(false);
  };

  const saveEntreprise = async () => {
    await onSaveEntreprise(entrepriseForm);
  };

  const saveCondition = async () => {
    if (!conditionId) return;
    await onSaveConditionPaiement(conditionId);
  };

  const saveFacturation = async () => {
    await onSaveFacturationConfig(facturationForm);
  };

  const saveTransporteur = async () => {
    if (!transporteurId) return;
    await onSaveTransporteur(transporteurId);
  };

  const selectedTransporteur = transporteurs.find(
    (item) => item.id === transporteurId,
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-7 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-orange-950">
                <MapPin className="size-5" />
                Adresses
              </CardTitle>
              <CardDescription>
                Liste complete des points de contact et de facturation
              </CardDescription>
            </div>
            <Button size="sm" onClick={openCreateAddress} className="gap-2">
              <Plus className="size-4" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune adresse configuree.
            </p>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-xl border border-orange-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-800 border-orange-200"
                      >
                        {address.type || "N/A"}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-900">
                      {address.ligne1}
                    </p>
                    {address.ligne2 && (
                      <p className="text-slate-700">{address.ligne2}</p>
                    )}
                    <p className="text-slate-700">
                      {address.codePostal} {address.ville}
                    </p>
                    <p className="text-slate-700">{address.pays}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditAddress(address)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAddressToDelete(address)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-5 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-950">
            <Building2 className="size-5" />
            Entreprise info
          </CardTitle>
          <CardDescription>
            Raison sociale, TVA et SIREN du client entreprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Raison sociale</Label>
            <Input
              value={entrepriseForm.raisonSociale}
              onChange={(event) =>
                setEntrepriseForm((prev) => ({
                  ...prev,
                  raisonSociale: event.target.value,
                }))
              }
              placeholder="Ex: Acme SAS"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Numero TVA</Label>
              <Input
                value={entrepriseForm.numeroTva}
                onChange={(event) =>
                  setEntrepriseForm((prev) => ({
                    ...prev,
                    numeroTva: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>SIREN</Label>
              <Input
                value={entrepriseForm.siren}
                onChange={(event) =>
                  setEntrepriseForm((prev) => ({
                    ...prev,
                    siren: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <Button
            onClick={saveEntreprise}
            disabled={saving}
            className="w-full gap-2"
          >
            <Save className="size-4" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-950">
            <CreditCard className="size-5" />
            Conditions de paiement
          </CardTitle>
          <CardDescription>
            Choix de la condition appliquee au client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={conditionId} onValueChange={setConditionId}>
            <SelectTrigger>
              <SelectValue placeholder="Selectionner une condition" />
            </SelectTrigger>
            <SelectContent>
              {conditionsPaiement.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={saveCondition}
            disabled={saving || !conditionId}
            className="w-full gap-2"
          >
            <Save className="size-4" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-950">Facturation config</CardTitle>
          <CardDescription>
            Emission, mode et periode de facturation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Emission</Label>
            <Select
              value={facturationForm.emissionFactureId}
              onValueChange={(value) =>
                setFacturationForm((prev) => ({
                  ...prev,
                  emissionFactureId: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {emissionsFacture.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Facturation par</Label>
            <Select
              value={facturationForm.facturationParId}
              onValueChange={(value) =>
                setFacturationForm((prev) => ({
                  ...prev,
                  facturationParId: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {facturationsPar.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Periode</Label>
            <Select
              value={facturationForm.periodeFacturationId}
              onValueChange={(value) =>
                setFacturationForm((prev) => ({
                  ...prev,
                  periodeFacturationId: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {periodesFacturation.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={saveFacturation}
            disabled={saving}
            className="w-full gap-2"
          >
            <Save className="size-4" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-4 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-950">
            <Truck className="size-5" />
            Transport
          </CardTitle>
          <CardDescription>
            Compte transporteur utilise pour ce client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={transporteurId} onValueChange={setTransporteurId}>
            <SelectTrigger>
              <SelectValue placeholder="Selectionner un transporteur" />
            </SelectTrigger>
            <SelectContent>
              {transporteurs.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.type} - {option.contractNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTransporteur && (
            <div className="rounded-lg border border-cyan-200 bg-white p-3 text-sm space-y-1">
              <p>
                <span className="text-slate-500">Contrat:</span>{" "}
                {selectedTransporteur.contractNumber || "N/A"}
              </p>
              <p>
                <span className="text-slate-500">Label:</span>{" "}
                {selectedTransporteur.labelFormat || "N/A"}
              </p>
              <p>
                <span className="text-slate-500">Statut:</span>{" "}
                {selectedTransporteur.actif ? "Actif" : "Inactif"}
              </p>
            </div>
          )}
          <Button
            onClick={saveTransporteur}
            disabled={saving || !transporteurId}
            className="w-full gap-2"
          >
            <Save className="size-4" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-12 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="size-5" />
            Documents / Pieces jointes
          </CardTitle>
          <CardDescription>Fichiers associes au dossier client</CardDescription>
        </CardHeader>
        <CardContent>
          {piecesJointes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun document disponible.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {piecesJointes.map((piece) => (
                <a
                  key={piece.id}
                  href={piece.url || "#"}
                  target={piece.url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50"
                >
                  <p className="font-medium text-sm text-slate-900 truncate">
                    {piece.nom}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {piece.type || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {piece.dateUpload || "-"}
                  </p>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Modifier l'adresse" : "Ajouter une adresse"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de contact et de localisation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={addressForm.type}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    type: event.target.value,
                  }))
                }
                placeholder="facturation"
              />
            </div>
            <div className="space-y-2">
              <Label>Ligne 1</Label>
              <Input
                value={addressForm.ligne1}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    ligne1: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ligne 2</Label>
              <Input
                value={addressForm.ligne2 || ""}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    ligne2: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={addressForm.codePostal}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      codePostal: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Ville</Label>
                <Input
                  value={addressForm.ville}
                  onChange={(event) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      ville: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input
                value={addressForm.pays}
                onChange={(event) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    pays: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddressDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={submitAddress}
              disabled={
                saving ||
                !addressForm.ligne1 ||
                !addressForm.codePostal ||
                !addressForm.ville
              }
            >
              {editingAddress ? "Mettre a jour" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(addressToDelete)}
        onOpenChange={(open) => !open && setAddressToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette adresse ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!addressToDelete) return;
                await onDeleteAddress(addressToDelete.id);
                setAddressToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
