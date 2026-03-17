"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Critere {
  id: string;
  libelle: string;
  description?: string;
  obligatoire?: boolean;
}

interface ResultatCritere {
  critereId: string;
  conforme: boolean;
  commentaire?: string;
}

interface CQCritereChecklistProps {
  criteres: Critere[];
  resultats: ResultatCritere[];
  onChange: (critereId: string, conforme: boolean, commentaire: string) => void;
}

export function CQCritereChecklist({
  criteres,
  resultats,
  onChange,
}: CQCritereChecklistProps) {
  function getResultat(critereId: string): ResultatCritere | undefined {
    return resultats.find((r) => r.critereId === critereId);
  }

  if (criteres.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucun critère défini.</p>
    );
  }

  return (
    <div className="space-y-4">
      {criteres.map((critere) => {
        const resultat = getResultat(critere.id);
        return (
          <div key={critere.id} className="rounded-md border p-3 space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id={`critere-${critere.id}`}
                checked={resultat?.conforme ?? false}
                onCheckedChange={(checked) =>
                  onChange(
                    critere.id,
                    Boolean(checked),
                    resultat?.commentaire ?? ""
                  )
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor={`critere-${critere.id}`}
                  className="font-medium cursor-pointer"
                >
                  {critere.libelle}
                  {critere.obligatoire && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </Label>
                {critere.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {critere.description}
                  </p>
                )}
              </div>
            </div>
            <Input
              placeholder="Commentaire (optionnel)"
              value={resultat?.commentaire ?? ""}
              onChange={(e) =>
                onChange(critere.id, resultat?.conforme ?? false, e.target.value)
              }
              className="text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
