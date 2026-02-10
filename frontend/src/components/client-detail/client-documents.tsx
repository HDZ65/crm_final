"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Download, FileText, Calendar, FolderOpen } from "lucide-react"
import type { Document } from "@/lib/ui/display-types/client"

interface ClientDocumentsProps {
  documents: Document[]
  onAddDocument?: () => void
  onDownloadDocument?: (doc: Document) => void
}

export function ClientDocuments({
  documents,
  onAddDocument,
  onDownloadDocument,
}: ClientDocumentsProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 flex-1 flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
              <FolderOpen className="size-5" />
              Documents récents
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Partagez et stockez les pièces clefs du dossier
            </p>
          </div>
          <Button size="sm" onClick={onAddDocument} className="gap-2">
            <Plus className="size-4" />
            Ajouter un document
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.name}
                className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 rounded-lg bg-blue-100 p-2">
                    <FileText className="size-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{doc.name}</div>
                    <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-blue-700">{doc.type}</span>
                      <span className="text-slate-400">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        Màj {doc.updated}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hover:bg-blue-50"
                  onClick={() => onDownloadDocument?.(doc)}
                >
                  <Download className="size-4" />
                  Télécharger
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
