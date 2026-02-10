"use client";

import * as React from "react";
import { toast } from "sonner";
import { updateContratJourPrelevement } from "@/actions/contrats";
import type { ContratWithDetails } from "@proto/contrats/contrats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileText,
  History,
  User,
  UserRound,
} from "lucide-react";

interface ContratDetailClientProps {
  contratId: string;
  initialDetails: ContratWithDetails;
  clientName: string | null;
  commercialName: string | null;
}

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatMontant = (value?: number) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

const getStatusBadgeClass = (statut: string) => {
  const key = statut.toLowerCase();
  if (key.includes("actif")) {
    return "bg-emerald-100 border-emerald-200 text-emerald-700";
  }
  if (key.includes("suspend")) {
    return "bg-amber-100 border-amber-200 text-amber-700";
  }
  if (key.includes("resili") || key.includes("termin")) {
    return "bg-rose-100 border-rose-200 text-rose-700";
  }
  return "bg-slate-100 border-slate-200 text-slate-700";
};

export function ContratDetailClient({
  contratId,
  initialDetails,
  clientName,
  commercialName,
}: ContratDetailClientProps) {
  const [details, setDetails] = React.useState(initialDetails);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [jourInput, setJourInput] = React.useState<number>(
    initialDetails.contrat?.jourPrelevement ?? 1
  );

  const contrat = details.contrat;

  if (!contrat) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Contrat introuvable</p>
      </main>
    );
  }

  const hasPrelevementConfigured =
    typeof contrat.jourPrelevement === "number" && contrat.jourPrelevement > 0;

  const onSaveJourPrelevement = async () => {
    if (!Number.isInteger(jourInput) || jourInput < 1 || jourInput > 28) {
      toast.error("Le jour doit etre compris entre 1 et 28");
      return;
    }

    setSaving(true);
    const result = await updateContratJourPrelevement({
      id: contratId,
      jourPrelevement: jourInput,
    });

    if (result.error || !result.data) {
      toast.error(result.error || "Erreur lors de la mise a jour");
      setSaving(false);
      return;
    }

    const updatedContrat = result.data;

    setDetails((prev) => ({
      ...prev,
      contrat: prev.contrat
        ? {
            ...prev.contrat,
            ...updatedContrat,
          }
        : updatedContrat,
    }));

    toast.success("Jour de prelevement mis a jour");
    setSaving(false);
    setDialogOpen(false);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-950">
            <FileText className="size-5" />
            Contrat {contrat.reference || contrat.id}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Reference
            </p>
            <p className="font-mono text-sm">{contrat.reference || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Statut
            </p>
            <Badge className={getStatusBadgeClass(contrat.statut || "")}>{contrat.statut || "-"}</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Montant
            </p>
            <p className="text-sm font-semibold flex items-center gap-2">
              <CircleDollarSign className="size-4 text-slate-500" />
              {formatMontant(contrat.montant)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Date de debut
            </p>
            <p className="text-sm flex items-center gap-2">
              <CalendarDays className="size-4 text-slate-500" />
              {formatDate(contrat.dateDebut)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Date de fin
            </p>
            <p className="text-sm flex items-center gap-2">
              <CalendarDays className="size-4 text-slate-500" />
              {formatDate(contrat.dateFin)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Date signature
            </p>
            <p className="text-sm flex items-center gap-2">
              <CalendarDays className="size-4 text-slate-500" />
              {formatDate(contrat.dateSignature)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Client
            </p>
            <p className="text-sm flex items-center gap-2">
              <User className="size-4 text-slate-500" />
              {clientName || contrat.clientId || "-"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Commercial
            </p>
            <p className="text-sm flex items-center gap-2">
              <UserRound className="size-4 text-slate-500" />
              {commercialName || contrat.commercialId || "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDollarSign className="size-4" />
            Prelevement
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                {hasPrelevementConfigured ? "Modifier" : "Configurer"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Jour de prelevement</DialogTitle>
                <DialogDescription>
                  Choisissez un jour fixe entre 1 et 28.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={jourInput}
                  onChange={(event) =>
                    setJourInput(Number(event.target.value || "1"))
                  }
                />
              </div>
              <DialogFooter>
                <Button onClick={onSaveJourPrelevement} disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {hasPrelevementConfigured ? (
            <div className="space-y-1 text-sm">
              <p>Jour de prelevement: Le {contrat.jourPrelevement} de chaque mois</p>
              <p>Prochaine date: {formatDate(contrat.prochaineDatePrelevement)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Non configure</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="size-4" />
            Lignes du contrat
          </CardTitle>
        </CardHeader>
        <CardContent>
          {details.lignes.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Quantite</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.lignes.map((ligne) => (
                    <TableRow key={ligne.id}>
                      <TableCell className="font-mono text-xs">
                        {ligne.produitId || "-"}
                      </TableCell>
                      <TableCell>{ligne.canalVente || "-"}</TableCell>
                      <TableCell>{ligne.quantite}</TableCell>
                      <TableCell>{formatMontant(ligne.prixUnitaire)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune ligne de contrat disponible</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="size-4" />
            Historique des statuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {details.historique.length > 0 ? (
            <div className="space-y-3">
              {details.historique.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-border/80 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {item.ancienStatutId || "-"} -&gt; {item.nouveauStatutId || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(item.dateChangement)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun historique disponible</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
