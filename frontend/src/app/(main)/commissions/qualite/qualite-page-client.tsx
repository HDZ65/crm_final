"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CQDashboardStats } from "@/components/commissions/cq-dashboard-stats";
import { CQStatusChart } from "@/components/commissions/cq-status-chart";
import { CQReviewDialog } from "@/components/commissions/cq-review-dialog";
import { getControles, getStatistiques } from "@/actions/qualite";
import { toast } from "sonner";

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", color: "bg-gray-100 text-gray-700" },
  EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700" },
  VALIDE: { label: "Validé", color: "bg-green-100 text-green-700" },
  REJETE: { label: "Rejeté", color: "bg-red-100 text-red-700" },
  RETOUR: { label: "Retour", color: "bg-orange-100 text-orange-700" },
};

const STATUTS = ["", "EN_ATTENTE", "EN_COURS", "VALIDE", "REJETE", "RETOUR"];

interface Controle {
  id: string;
  contratRef?: string;
  statut: string;
  score?: number;
  validateur?: string;
  dateSoumission?: string;
}

export function QualitePageClient() {
  const [controles, setControles] = React.useState<Controle[]>([]);
  const [stats, setStats] = React.useState<{
    enAttente: number; enCours: number; valide: number;
    rejete: number; retour: number; tauxValidation: number;
  } | undefined>();
  const [statut, setStatut] = React.useState("");
  const [selectedControle, setSelectedControle] = React.useState<Controle | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [controlesResult, statsResult] = await Promise.all([
        getControles({ organisationId: "default", statut: statut || undefined }),
        getStatistiques("default"),
      ]);
      if (controlesResult.data) {
        setControles((controlesResult.data.controles ?? []) as Controle[]);
      }
      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, [statut]);

  function handleReviser(controle: Controle) {
    setSelectedControle(controle);
    setDialogOpen(true);
  }

  function formatDate(d?: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR");
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Contrôle Qualité</h1>
        <p className="text-muted-foreground">Gestion des contrôles qualité des contrats</p>
      </div>

      <CQDashboardStats stats={stats} />

      <Card>
        <CardContent className="pt-4">
          <CQStatusChart data={stats} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            {STATUTS.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUT_CONFIG[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          {loading ? "Chargement..." : "Actualiser"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence contrat</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Validateur</TableHead>
              <TableHead>Date soumission</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {controles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {loading ? "Chargement..." : "Aucun contrôle qualité"}
                </TableCell>
              </TableRow>
            ) : (
              controles.map((c) => {
                const cfg = STATUT_CONFIG[c.statut];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.contratRef ?? c.id}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg?.color ?? ""}`}>
                        {cfg?.label ?? c.statut}
                      </span>
                    </TableCell>
                    <TableCell>{c.score != null ? `${c.score}%` : "—"}</TableCell>
                    <TableCell>{c.validateur ?? "—"}</TableCell>
                    <TableCell>{formatDate(c.dateSoumission)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => handleReviser(c)}>
                        Réviser
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedControle && (
        <CQReviewDialog
          controleId={selectedControle.id}
          contratRef={selectedControle.contratRef}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
