"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { DocumentTypeBadge } from "./document-type-badge";
import { getDocumentDownloadUrl } from "@/actions/documents";
import { toast } from "sonner";
import type { PieceJointe } from "@proto/documents/documents";

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DocumentDetailDialogProps {
  document: PieceJointe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentDetailDialog({
  document,
  open,
  onOpenChange,
}: DocumentDetailDialogProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  async function handleDownload() {
    if (!document?.id) return;
    setIsDownloading(true);
    try {
      const result = await getDocumentDownloadUrl(document.id);
      if (result.error || !result.data) {
        toast.error(result.error ?? "Impossible d'obtenir l'URL");
      } else {
        window.open(result.data.url, "_blank");
      }
    } catch {
      toast.error("Erreur lors du téléchargement");
    } finally {
      setIsDownloading(false);
    }
  }

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {document.nomFichier}
            <DocumentTypeBadge typeDocument={document.typeDocument} />
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Nom du fichier</p>
                <p className="font-medium">{document.nomFichier}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <DocumentTypeBadge typeDocument={document.typeDocument} />
              </div>
              <div>
                <p className="text-muted-foreground">Type MIME</p>
                <p className="font-medium">{document.typeMime || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Taille</p>
                <p className="font-medium">{formatBytes(document.taille)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">{document.version ?? 1}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date d'upload</p>
                <p className="font-medium">{formatDate(document.dateUpload)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Uploadé par</p>
                <p className="font-medium">{document.uploadedBy || "—"}</p>
              </div>
              {document.hashSha256 && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">SHA-256</p>
                  <p className="font-mono text-xs break-all">{document.hashSha256}</p>
                </div>
              )}
            </div>
            <div className="pt-2">
              <Button onClick={handleDownload} disabled={isDownloading} size="sm">
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Chargement..." : "Télécharger"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="pt-4">
            <p className="text-sm text-muted-foreground">
              Version actuelle : v{document.version ?? 1}
            </p>
            {document.parentId && (
              <p className="text-sm text-muted-foreground mt-1">
                Document parent : {document.parentId}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Historique des versions non disponible dans cette vue.
            </p>
          </TabsContent>

          <TabsContent value="historique" className="pt-4">
            <p className="text-sm text-muted-foreground">
              Historique des accès non disponible dans cette vue.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
