import { InterfastPageClient } from "./interfast-page-client"
import { getActiveOrgId } from "@/lib/server/data"
import { getInterfastConfig, getInterfastEnabledRoutes } from "@/actions/interfast"

export default async function InterfastPage() {
  const activeOrgId = await getActiveOrgId()

  const [configResult, routesResult] = await Promise.all([
    activeOrgId
      ? getInterfastConfig(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
    activeOrgId
      ? getInterfastEnabledRoutes(activeOrgId)
      : Promise.resolve({ data: null, error: null }),
  ])

  return (
    <InterfastPageClient
      activeOrgId={activeOrgId}
      initialConfig={configResult.data ?? null}
      initialEnabledRoutes={routesResult.data?.enabledRoutes ?? []}
    />
  )
}
