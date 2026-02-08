import { PermissionsPageClient } from "./permissions-page-client"
import { listPermissions } from "@/actions/permissions"

export default async function PermissionsPage() {
  const result = await listPermissions()

  return <PermissionsPageClient initialPermissions={result.data?.permissions} />
}
