import { RolesPermissionsPageClient } from "./roles-permissions-page-client"
import { listRolePermissionsByRole as listRolePermissions } from "@/actions/permissions"

export default async function RolesPermissionsPage() {
  const result = await listRolePermissions("")

  return <RolesPermissionsPageClient initialRolePermissions={result.data?.rolePermissions} />
}
