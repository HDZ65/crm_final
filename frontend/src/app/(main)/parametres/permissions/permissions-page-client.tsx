"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  listPermissions,
  createPermissionAction,
  updatePermissionAction as updatePermission,
  deletePermissionAction as deletePermission,
} from "@/actions/permissions"
import type { Permission } from "@proto/organisations/users"
import { Plus, Pencil, Trash2, Loader2, Shield, Search } from "lucide-react"

interface PermissionsPageClientProps {
  initialPermissions?: Permission[] | null
}

export function PermissionsPageClient({ initialPermissions }: PermissionsPageClientProps) {
  const [permissions, setPermissions] = React.useState<Permission[]>(initialPermissions || [])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedPermission, setSelectedPermission] = React.useState<Permission | null>(null)
  const [formData, setFormData] = React.useState({
    code: "",
    description: "",
  })

  const fetchPermissions = React.useCallback(async () => {
    setLoading(true)
    const result = await listPermissions()
    if (result.data) {
      setPermissions(result.data.permissions || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  const filteredPermissions = React.useMemo(() => {
    if (!search) return permissions
    const q = search.toLowerCase()
    return permissions.filter(
      (p) => p.code.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    )
  }, [permissions, search])

  const handleCreate = () => {
    setSelectedPermission(null)
    setFormData({ code: "", description: "" })
    setDialogOpen(true)
  }

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission)
    setFormData({
      code: permission.code,
      description: permission.description || "",
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (permission: Permission) => {
    setSelectedPermission(permission)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code || !formData.description) {
      toast.error("Code et description sont obligatoires")
      return
    }

    setLoading(true)

    if (selectedPermission) {
      const result = await updatePermission({
        id: selectedPermission.id,
        ...formData,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Permission mise a jour")
        setDialogOpen(false)
        fetchPermissions()
      }
    } else {
      const result = await createPermissionAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Permission creee")
        setDialogOpen(false)
        fetchPermissions()
      }
    }

    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedPermission) return

    setLoading(true)
    const result = await deletePermission(selectedPermission.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Permission supprimee")
      setDeleteDialogOpen(false)
      fetchPermissions()
    }

    setLoading(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="size-6" />
            Permissions
          </h1>
          <p className="text-muted-foreground">
            Gerez les permissions utilisables pour les roles de votre organisation.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" />
          Nouvelle permission
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des permissions</CardTitle>
              <CardDescription>
                {permissions.length} permission{permissions.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    {search ? "Aucun resultat" : "Aucune permission"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {permission.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {permission.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(permission)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(permission)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPermission ? "Modifier la permission" : "Nouvelle permission"}
            </DialogTitle>
            <DialogDescription>
              {selectedPermission
                ? "Modifiez les informations de la permission"
                : "Creez une nouvelle permission"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                placeholder="PERMISSION_CODE"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Description de la permission..."
                rows={3}
              />
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
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                {selectedPermission ? "Enregistrer" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette permission ?</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer la permission{" "}
              <strong>{selectedPermission?.code}</strong> ? Cette action est irreversible.
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
    </main>
  )
}
