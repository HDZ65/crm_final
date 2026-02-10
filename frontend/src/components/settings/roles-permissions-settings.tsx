"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Shield, Plus, Trash2, Loader2, AlertCircle, Lock, Search } from "lucide-react"
import { useOrganisation } from "@/contexts/organisation-context"
import { toast } from "sonner"
import {
  listRolePermissionsByRole as listRolePermissions,
  createRolePermissionAction as createRolePermission,
  deleteRolePermissionAction as deleteRolePermission,
} from "@/actions/permissions"
import type { RolePermission } from "@proto/organisations/users"

interface RolesPermissionsSettingsProps {
  onOpenChange: (open: boolean) => void
}

export function RolesPermissionsSettings({ onOpenChange }: RolesPermissionsSettingsProps) {
  const { activeOrganisation, isOwner } = useOrganisation()
  
  const [rolePermissions, setRolePermissions] = React.useState<RolePermission[]>([])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [roleIdFilter, setRoleIdFilter] = React.useState("")

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedRolePermission, setSelectedRolePermission] = React.useState<RolePermission | null>(null)
  const [formData, setFormData] = React.useState({
    roleId: "",
    permissionId: "",
  })

  const fetchRolePermissions = React.useCallback(async (roleId: string) => {
    if (!roleId) {
      setRolePermissions([])
      return
    }

    setLoading(true)
    const result = await listRolePermissions(roleId)
    if (result.data) {
      setRolePermissions(result.data.rolePermissions || [])
    } else if (result.error) {
      toast.error(result.error)
    }
    setLoading(false)
  }, [])

  const filteredRolePermissions = React.useMemo(() => {
    if (!search) return rolePermissions
    const q = search.toLowerCase()
    return rolePermissions.filter(
      (rp) => rp.roleId.toLowerCase().includes(q) || rp.permissionId.toLowerCase().includes(q)
    )
  }, [rolePermissions, search])

  const handleCreate = () => {
    setFormData({ roleId: roleIdFilter, permissionId: "" })
    setDialogOpen(true)
  }

  const handleDeleteClick = (rolePermission: RolePermission) => {
    setSelectedRolePermission(rolePermission)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.roleId || !formData.permissionId) {
      toast.error("Role ID et Permission ID sont obligatoires")
      return
    }

    setLoading(true)
    const result = await createRolePermission(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Assignation créée")
      setDialogOpen(false)
      setRoleIdFilter(formData.roleId)
      fetchRolePermissions(formData.roleId)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selectedRolePermission) return

    setLoading(true)
    const result = await deleteRolePermission(selectedRolePermission.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Assignation supprimée")
      setDeleteDialogOpen(false)
      fetchRolePermissions(selectedRolePermission.roleId)
    }

    setLoading(false)
  }

  // Message si aucune organisation n'est sélectionnée
  if (!activeOrganisation?.organisationId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Rôles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les rôles et permissions de votre organisation.
          </p>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Veuillez sélectionner une organisation pour gérer les rôles et permissions.
          </p>
        </div>
      </div>
    )
  }

  // Message si l'utilisateur n'est pas administrateur
  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Rôles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les rôles et permissions de votre organisation.
          </p>
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
          <Lock className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Seuls les propriétaires de l&apos;organisation peuvent configurer les rôles et permissions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rôles & Permissions
          </h3>
          <p className="text-sm text-muted-foreground">
            Gérez les assignations de permissions aux rôles.
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle assignation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Assignations</CardTitle>
              <CardDescription>
                {rolePermissions.length} assignation{rolePermissions.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                placeholder="Role ID pour charger"
                value={roleIdFilter}
                onChange={(e) => setRoleIdFilter(e.target.value)}
                className="w-full md:w-48 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRolePermissions(roleIdFilter)}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Charger
              </Button>
              <div className="relative w-full md:w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[300px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[35%]">Role ID</TableHead>
                  <TableHead className="w-[35%]">Permission ID</TableHead>
                  <TableHead className="w-[20%]">Date</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRolePermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-sm">
                      {search
                        ? "Aucun résultat"
                        : roleIdFilter
                          ? "Aucune assignation"
                          : "Renseignez un Role ID pour charger les assignations"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRolePermissions.map((rolePermission) => (
                    <TableRow key={rolePermission.id}>
                      <TableCell className="font-mono text-xs">{rolePermission.roleId}</TableCell>
                      <TableCell className="font-mono text-xs">{rolePermission.permissionId}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(rolePermission.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(rolePermission)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour créer une assignation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nouvelle assignation</DialogTitle>
            <DialogDescription>
              Assignez une permission à un rôle en renseignant leurs identifiants.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleId">Role ID *</Label>
              <Input
                id="roleId"
                value={formData.roleId}
                onChange={(e) => setFormData((p) => ({ ...p, roleId: e.target.value }))}
                placeholder="uuid-du-role"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permissionId">Permission ID *</Label>
              <Input
                id="permissionId"
                value={formData.permissionId}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, permissionId: e.target.value }))
                }
                placeholder="uuid-de-la-permission"
                className="font-mono"
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
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette assignation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette assignation role-permission ? Cette action est
              irréversible.
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
