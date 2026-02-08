"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  listRolePermissionsByRole as listRolePermissions,
  createRolePermissionAction as createRolePermission,
  deleteRolePermissionAction as deleteRolePermission,
} from "@/actions/permissions"
import type { RolePermission } from "@proto/organisations/users"
import { Plus, Trash2, Loader2, ShieldCheck, Search } from "lucide-react"

interface RolesPermissionsPageClientProps {
  initialRolePermissions?: RolePermission[] | null
}

export function RolesPermissionsPageClient({
  initialRolePermissions,
}: RolesPermissionsPageClientProps) {
  const [rolePermissions, setRolePermissions] = React.useState<RolePermission[]>(
    initialRolePermissions || []
  )
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
      toast.success("Assignation creee")
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
      toast.success("Assignation supprimee")
      setDeleteDialogOpen(false)
      fetchRolePermissions(selectedRolePermission.roleId)
    }

    setLoading(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="size-6" />
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground">
            Gere les assignations de permissions aux roles de votre organisation.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4 mr-2" />
          Nouvelle assignation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Liste des assignations</CardTitle>
              <CardDescription>
                {rolePermissions.length} assignation{rolePermissions.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Input
                placeholder="Role ID pour charger"
                value={roleIdFilter}
                onChange={(e) => setRoleIdFilter(e.target.value)}
                className="w-full md:w-64"
              />
              <Button
                variant="outline"
                onClick={() => fetchRolePermissions(roleIdFilter)}
                disabled={loading}
              >
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Charger
              </Button>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role ID</TableHead>
                <TableHead>Permission ID</TableHead>
                <TableHead>Date de creation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRolePermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {search
                      ? "Aucun resultat"
                      : roleIdFilter
                        ? "Aucune assignation"
                        : "Renseignez un Role ID pour charger les assignations"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRolePermissions.map((rolePermission) => (
                  <TableRow key={rolePermission.id}>
                    <TableCell className="font-mono">{rolePermission.roleId}</TableCell>
                    <TableCell className="font-mono">{rolePermission.permissionId}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(rolePermission.createdAt).toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(rolePermission)}
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
            <DialogTitle>Nouvelle assignation</DialogTitle>
            <DialogDescription>
              Assignez une permission a un role en renseignant leurs identifiants.
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
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Creer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette assignation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Etes-vous sur de vouloir supprimer cette assignation role-permission ? Cette action est
              irreversible.
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
