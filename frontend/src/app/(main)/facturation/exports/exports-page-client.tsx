"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { generateJournal, generateFec } from "@/actions/exports";

function downloadBase64(base64: string, filename: string, mimeType: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function JournalSection({
  title,
  journalType,
}: {
  title: string;
  journalType: "VENTES" | "REGLEMENTS" | "IMPAYES";
}) {
  const [month, setMonth] = React.useState(String(new Date().getMonth() + 1));
  const [year, setYear] = React.useState(String(new Date().getFullYear()));
  const [loading, setLoading] = React.useState<"CSV" | "FEC" | null>(null);

  async function handleGenerate(format: "CSV" | "FEC") {
    setLoading(format);
    const periodFrom = `${year}-${month.padStart(2, "0")}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const periodTo = `${year}-${month.padStart(2, "0")}-${lastDay}`;
    try {
      const result = await generateJournal({
        societeId: "default",
        journalType,
        periodFrom,
        periodTo,
        format,
      });
      if (result.error || !result.data) {
        toast.error(result.error ?? "Erreur lors de la génération");
      } else {
        downloadBase64(result.data.content, result.data.filename, result.data.mimeType);
        toast.success(`${title} généré`);
      }
    } catch {
      toast.error("Erreur lors de la génération");
    } finally {
      setLoading(null);
    }
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear].map(String);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {journalType === "IMPAYES" && (
          <p className="text-xs text-muted-foreground">
            Inclut l'analyse d'ancienneté : 0-30j, 31-60j, 61-90j, &gt;90j
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate("CSV")}
            disabled={loading !== null}
          >
            {loading === "CSV" ? "Génération..." : "Générer CSV"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleGenerate("FEC")}
            disabled={loading !== null}
          >
            {loading === "FEC" ? "Génération..." : "Générer FEC"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExportsPageClient() {
  const [siren, setSiren] = React.useState("");
  const [dateCloture, setDateCloture] = React.useState("");
  const [fecLoading, setFecLoading] = React.useState(false);

  async function handleGenerateFec() {
    if (!siren || !dateCloture) {
      toast.error("SIREN et date de clôture requis");
      return;
    }
    setFecLoading(true);
    try {
      const dateFormatted = dateCloture.replace(/-/g, "");
      const result = await generateFec({
        societeId: "default",
        siren,
        dateCloture: dateFormatted,
      });
      if (result.error || !result.data) {
        toast.error(result.error ?? "Erreur lors de la génération FEC");
      } else {
        downloadBase64(
          result.data.content,
          result.data.filename ?? `${siren}FEC${dateFormatted}.txt`,
          "text/plain"
        );
        toast.success("FEC généré");
      }
    } catch {
      toast.error("Erreur lors de la génération FEC");
    } finally {
      setFecLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Exports Comptables</h1>
        <p className="text-muted-foreground">
          Générez vos journaux comptables et fichiers FEC
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <JournalSection title="Journal de Ventes" journalType="VENTES" />
        <JournalSection title="Journal de Règlements" journalType="REGLEMENTS" />
        <JournalSection title="Journal d'Impayés" journalType="IMPAYES" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fichier FEC (Fichier des Écritures Comptables)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Norme article A47 A-1 du Livre des Procédures Fiscales — 18 colonnes, séparateur tabulation
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div className="space-y-1">
              <Label htmlFor="siren">SIREN *</Label>
              <Input
                id="siren"
                placeholder="123456789"
                maxLength={9}
                value={siren}
                onChange={(e) => setSiren(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dateCloture">Date de clôture *</Label>
              <Input
                id="dateCloture"
                type="date"
                value={dateCloture}
                onChange={(e) => setDateCloture(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleGenerateFec} disabled={fecLoading}>
            {fecLoading ? "Génération..." : "Générer FEC"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
