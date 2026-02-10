"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react"
import { useOrganisation } from "@/contexts/organisation-context"
import { createApporteur } from "@/actions/commerciaux"
import type { TypeApporteur } from "@/lib/ui/display-types/commission"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface ParsedCommercial {
  nom: string
  prenom: string
  typeApporteur: TypeApporteur
  email?: string
  telephone?: string
}

interface ImportResult {
  success: number
  errors: { line: number; error: string }[]
}

interface ImportCommercialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const VALID_TYPES: TypeApporteur[] = ["vrp", "manager", "directeur", "partenaire"]

function parseCSV(content: string): { data: ParsedCommercial[]; errors: { line: number; error: string }[] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim())
  const data: ParsedCommercial[] = []
  const errors: { line: number; error: string }[] = []

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // Handle both ; and , as separators, and remove quotes
    const parts = line.split(/[;,]/).map((p) => p.trim().replace(/^"|"$/g, ""))

    if (parts.length < 3) {
      errors.push({ line: i + 1, error: "Ligne incomplète (min: nom, prénom, type)" })
      continue
    }

    const [nom, prenom, typeApporteur, email, telephone] = parts

    if (!nom) {
      errors.push({ line: i + 1, error: "Nom manquant" })
      continue
    }

    if (!prenom) {
      errors.push({ line: i + 1, error: "Prénom manquant" })
      continue
    }

    const normalizedType = typeApporteur.toLowerCase() as TypeApporteur
    if (!VALID_TYPES.includes(normalizedType)) {
      errors.push({ line: i + 1, error: `Type invalide: "${typeApporteur}" (attendu: vrp, manager, directeur, partenaire)` })
      continue
    }

    data.push({
      nom,
      prenom,
      typeApporteur: normalizedType,
      email: email || undefined,
      telephone: telephone || undefined,
    })
  }

  return { data, errors }
}

export function ImportCommercialDialog({ open, onOpenChange, onSuccess }: ImportCommercialDialogProps) {
  const { activeOrganisation } = useOrganisation()
  const [file, setFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<{ data: ParsedCommercial[]; errors: { line: number; error: string }[] } | null>(null)
  const [importing, setImporting] = React.useState(false)
  const [result, setResult] = React.useState<ImportResult | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResult(null)

    const content = await selectedFile.text()
    const parsed = parseCSV(content)
    setPreview(parsed)
  }

  const handleImport = async () => {
    if (!preview || !activeOrganisation) return

    setImporting(true)
    const importResult: ImportResult = { success: 0, errors: [] }

    for (let i = 0; i < preview.data.length; i++) {
      const commercial = preview.data[i]
      try {
        const response = await createApporteur({
          organisationId: activeOrganisation.organisationId,
          nom: commercial.nom,
          prenom: commercial.prenom,
          typeApporteur: commercial.typeApporteur.toUpperCase(),
          email: commercial.email,
          telephone: commercial.telephone,
        })

        if (response.data) {
          importResult.success++
        } else {
          importResult.errors.push({ line: i + 2, error: response.error || "Échec de création" })
        }
      } catch (err) {
        importResult.errors.push({ line: i + 2, error: "Erreur serveur" })
      }
    }

    setImporting(false)
    setResult(importResult)

    if (importResult.success > 0) {
      toast.success(`${importResult.success} commercial(s) importé(s)`)
      onSuccess?.()
    }

    if (importResult.errors.length > 0) {
      toast.error(`${importResult.errors.length} erreur(s) lors de l'import`)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    onOpenChange(false)
  }

  const downloadTemplate = () => {
    const template = `Nom;Prenom;Type;Email;Telephone
Dupont;Jean;vrp;jean.dupont@email.com;0612345678
Martin;Marie;manager;marie.martin@email.com;0698765432`

    const blob = new Blob(["\ufeff" + template], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "modele_import_commerciaux.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importer des commerciaux</DialogTitle>
          <DialogDescription>
            Importez des commerciaux depuis un fichier CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger le modèle CSV
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Fichier CSV</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              disabled={importing}
            />
            <p className="text-xs text-muted-foreground">
              Format attendu : Nom;Prénom;Type;Email;Téléphone (Type: vrp, manager, directeur, partenaire)
            </p>
          </div>

          {preview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <FileText className="mr-1 h-3 w-3" />
                  {preview.data.length} ligne(s) valide(s)
                </Badge>
                {preview.errors.length > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {preview.errors.length} erreur(s)
                  </Badge>
                )}
              </div>

              {preview.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ScrollArea className="h-24">
                      <ul className="text-sm space-y-1">
                        {preview.errors.map((err, idx) => (
                          <li key={idx}>Ligne {err.line}: {err.error}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {preview.data.length > 0 && (
                <div className="border rounded-md">
                  <ScrollArea className="h-40">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Nom</th>
                          <th className="px-2 py-1 text-left">Prénom</th>
                          <th className="px-2 py-1 text-left">Type</th>
                          <th className="px-2 py-1 text-left">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.slice(0, 10).map((c, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-1">{c.nom}</td>
                            <td className="px-2 py-1">{c.prenom}</td>
                            <td className="px-2 py-1">{c.typeApporteur}</td>
                            <td className="px-2 py-1">{c.email || "-"}</td>
                          </tr>
                        ))}
                        {preview.data.length > 10 && (
                          <tr className="border-t">
                            <td colSpan={4} className="px-2 py-1 text-center text-muted-foreground">
                              ... et {preview.data.length - 10} autres
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {result && (
            <Alert variant={result.errors.length === 0 ? "default" : "destructive"}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Import terminé : {result.success} succès, {result.errors.length} erreur(s)
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {result ? "Fermer" : "Annuler"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!preview || preview.data.length === 0 || importing}
            >
              {importing ? (
                <>Importation...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer {preview?.data.length || 0} commercial(s)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
