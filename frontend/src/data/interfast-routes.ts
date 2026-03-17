/**
 * Pre-parsed InterFast OpenAPI routes, grouped by tag.
 * Generated from https://developers.inter-fast.fr/open-api.json
 * Excludes the "hidden" tag (internal/deprecated endpoints).
 *
 * 58 tags, 357 routes total.
 */

import routesData from "./interfast-routes.json"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InterfastRoute {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  path: string
  operationId: string
  summary: string
  description: string
}

export interface InterfastRoutesByTag {
  [tag: string]: InterfastRoute[]
}

export interface InterfastRoutesData {
  tags: string[]
  totalRoutes: number
  routesByTag: InterfastRoutesByTag
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export const interfastRoutes: InterfastRoutesData =
  routesData as InterfastRoutesData

export const INTERFAST_TAGS = interfastRoutes.tags
export const INTERFAST_TOTAL_ROUTES = interfastRoutes.totalRoutes
export const INTERFAST_ROUTES_BY_TAG = interfastRoutes.routesByTag

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Couleur du badge HTTP method */
export function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50"
    case "POST":
      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50"
    case "PUT":
      return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/50"
    case "DELETE":
      return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50"
    case "PATCH":
      return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/50"
    default:
      return "text-muted-foreground bg-muted"
  }
}

/** Filtre les routes par recherche (path, operationId, tag) */
export function filterRoutes(
  routesByTag: InterfastRoutesByTag,
  search: string
): InterfastRoutesByTag {
  if (!search.trim()) return routesByTag

  const q = search.toLowerCase()
  const filtered: InterfastRoutesByTag = {}

  for (const [tag, routes] of Object.entries(routesByTag)) {
    const tagMatches = tag.toLowerCase().includes(q)

    const matchingRoutes = routes.filter(
      (r) =>
        tagMatches ||
        r.path.toLowerCase().includes(q) ||
        r.operationId.toLowerCase().includes(q) ||
        r.method.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
    )

    if (matchingRoutes.length > 0) {
      filtered[tag] = matchingRoutes
    }
  }

  return filtered
}
