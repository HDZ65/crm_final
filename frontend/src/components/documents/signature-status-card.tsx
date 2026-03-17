"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Send } from "lucide-react";
import { InitiateSignatureDialog } from "./initiate-signature-dialog";

type YousignStatus =
  | "draft"
  | "ongoing"
  | "done"
  | "expired"
  | "declined"
  | "canceled"
  | undefined;

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Brouillon", variant: "secondary" },
  ongoing: { label: "En cours", variant: "default" },
  done: { label: "Signé", variant: "default" },
  expired: { label: "Expiré", variant: "destructive" },
  declined: { label: "Refusé", variant: "destructive" },
  canceled: { label: "Annulé", variant: "secondary" },
};

interface SignatureStatusCardProps {
  contratId: string;
  signatureRequestId?: string;
  status?: YousignStatus;
  signerUrl?: string;
}

export function SignatureStatusCard({
  contratId,
  signatureRequestId,
  status,
  signerUrl,
}: SignatureStatusCardProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const config = status ? STATUS_CONFIG[status] : null;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Signature électronique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {config ? (
            <Badge variant={config.variant}>{config.label}</Badge>
          ) : (
            <Badge variant="secondary">Non envoyé</Badge>
          )}

          <div className="flex flex-wrap gap-2">
            {!signatureRequestId && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Send className="mr-2 h-3 w-3" />
                Envoyer pour signature
              </Button>
            )}
            {status === "ongoing" && signerUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={signerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Voir le suivi
                </a>
              </Button>
            )}
            {status === "done" && (
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-3 w-3" />
                Télécharger signé
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <InitiateSignatureDialog
        contratId={contratId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
