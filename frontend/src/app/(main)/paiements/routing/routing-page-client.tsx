"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createRoutingRule, deleteRoutingRule, listRoutingRules, updateRoutingRule } from "@/actions/routing"
import { toast } from "sonner"
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"

interface RoutingPageClientProps {
  initialRules?: any[] | null
  initialSocieteId?: string
}

interface RoutingFormData {
  name: string
  priority: number
  conditions: string
  providerAccountId: string
  isFallback: boolean
  isEnabled: boolean
}

const DEFAULT_FORM_DATA: RoutingFormData = {
  name: "",
  priority: 1,
  conditions: "{}",
  providerAccountId: "",
  isFallback: false,
  isEnabled: true,
}

function formatDate(value?: string) {
  if (!value) return "-"

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value

  return parsedDate.toLocaleString("fr-FR")
}

export function RoutingPageClient({ initialRules, initialSocieteId }: RoutingPageClientProps) {
  const societeId = initialSocieteId || ""

  const [rules, setRules] = React.useState<any[]>(initialRules || [])
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedRule, setSelectedRule] = React.useState<any | null>(null)
  const [formData, setFormData] = React.useState<RoutingFormData>(DEFAULT_FORM_DATA)

  const fetchRules = React.useCallback(async () => {
    if (!societeId) {
      setRules([])
      return
    }

    setLoading(true)
    const result = await listRoutingRules({ societeId, page: 1, limit: 100 } as any)
    if (result.error) {
      toast.error(result.error)
    } else {
      setRules(result.data?.rules || [])
    }
    setLoading(false)
  }, [societeId])

  const filteredRules = React.useMemo(() => {
    if (!search) return rules

    const query = search.toLowerCase()
    return rules.filter((rule) => {
      const name = String(rule.name || "").toLowerCase()
      const providerAccountId = String(rule.providerAccountId ?? rule.provider_account_id ?? "").toLowerCase()
      const conditions = String(rule.conditions || "").toLowerCase()

      return name.includes(query) || providerAccountId.includes(query) || conditions.includes(query)
    })
  }, [rules, search])

  const handleCreate = () => {
    setSelectedRule(null)
    setFormData(DEFAULT_FORM_DATA)
    setDialogOpen(true)
  }

  const handleEdit = (rule: any) => {
    setSelectedRule(rule)
    setFormData({
      name: rule.name || "",
      priority: Number(rule.priority || 1),
      conditions: rule.conditions || "{}",
      providerAccountId: rule.providerAccountId ?? rule.provider_account_id ?? "",
      isFallback: Boolean(rule.isFallback ?? rule.is_fallback ?? false),
      isEnabled: Boolean(rule.isEnabled ?? rule.is_enabled ?? false),
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (rule: any) => {
    setSelectedRule(rule)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!societeId) {
      toast.error("Aucune societe active detectee")
      return
    }

    if (!formData.name || !formData.providerAccountId) {
      toast.error("Nom et compte fournisseur sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedRule) {
      const result = await updateRoutingRule({
        id: selectedRule.id,
        name: formData.name,
        priority: formData.priority,
        conditions: formData.conditions,
        providerAccountId: formData.providerAccountId,
        isFallback: formData.isFallback,
        isEnabled: formData.isEnabled,
      } as any)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Regle de routage mise a jour")
        setDialogOpen(false)
        await fetchRules()
      }
    } else {
      const result = await createRoutingRule({
        societeId,
        name: formData.name,
        priority: formData.priority,
        conditions: formData.conditions,
        providerAccountId: formData.providerAccountId,
        isFallback: formData.isFallback,
        isEnabled: formData.isEnabled,
      } as any)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Regle de routage creee")
        setDialogOpen(false)
        await fetchRules()
      }
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedRule || !societeId) return

    setLoading(true)
    const result = await deleteRoutingRule(selectedRule.id, societeId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Regle de routage supprimee")
      setDeleteDialogOpen(false)
      await fetchRules()
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configurez les regles de routage PSP et leur priorite.
        </p>
        <Button onClick={handleCreate} disabled={!societeId}>
          <Plus className="mr-2 size-4" />
          Nouvelle regle
        </Button>
      </div>

      {!societeId && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Impossible de charger le routing: aucune societe active.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Regles de routage</CardTitle>
              <CardDescription>
                {rules.length} regle{rules.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full max-w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une regle..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Priorite</TableHead>
                <TableHead>Compte fournisseur</TableHead>
                <TableHead>Fallback</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Derniere maj</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {search ? "Aucune regle correspondante" : "Aucune regle de routage"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => {
                  const isEnabled = Boolean(rule.isEnabled ?? rule.is_enabled ?? false)
                  const isFallback = Boolean(rule.isFallback ?? rule.is_fallback ?? false)
                  const providerAccountId = rule.providerAccountId ?? rule.provider_account_id ?? "-"
                  const updatedAt = rule.updatedAt ?? rule.updated_at

                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.priority ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{providerAccountId}</TableCell>
                      <TableCell>
                        <Badge variant={isFallback ? "default" : "secondary"}>
                          {isFallback ? "Oui" : "Non"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isEnabled ? "default" : "secondary"}>
                          {isEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(rule)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(rule)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selectedRule ? "Modifier la regle" : "Nouvelle regle"}</DialogTitle>
            <DialogDescription>
              Definissez les conditions et le fournisseur de routage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Nom *</Label>
                <Input
                  id="rule-name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((previous) => ({ ...previous, name: event.target.value }))
                  }
                  placeholder="Regle web prioritaire"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-priority">Priorite *</Label>
                <Input
                  id="rule-priority"
                  type="number"
                  min={1}
                  value={formData.priority}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      priority: Number.parseInt(event.target.value, 10) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-provider">Compte fournisseur *</Label>
              <Input
                id="rule-provider"
                value={formData.providerAccountId}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, providerAccountId: event.target.value }))
                }
                placeholder="psp_account_main"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule-conditions">Conditions (JSON)</Label>
              <Textarea
                id="rule-conditions"
                value={formData.conditions}
                onChange={(event) =>
                  setFormData((previous) => ({ ...previous, conditions: event.target.value }))
                }
                rows={5}
                className="font-mono text-sm"
                placeholder='{"source_channel": ["WEB"]}'
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 rounded-md border p-3">
                <Checkbox
                  id="rule-enabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) =>
                    setFormData((previous) => ({ ...previous, isEnabled: checked === true }))
                  }
                />
                <Label htmlFor="rule-enabled">Regle active</Label>
              </div>
              <div className="flex items-center gap-2 rounded-md border p-3">
                <Checkbox
                  id="rule-fallback"
                  checked={formData.isFallback}
                  onCheckedChange={(checked) =>
                    setFormData((previous) => ({ ...previous, isFallback: checked === true }))
                  }
                />
                <Label htmlFor="rule-fallback">Fallback</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {selectedRule ? "Enregistrer" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette regle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la regle <strong>{selectedRule?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
