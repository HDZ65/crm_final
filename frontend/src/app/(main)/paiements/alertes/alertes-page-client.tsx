"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { acknowledgeAlert, getAlertStats, listAlerts } from "@/actions/finance-alerts"
import { toast } from "sonner"
import { RefreshCw, Search } from "lucide-react"

interface AlertesPageClientProps {
  initialAlerts?: any[] | null
  initialStats?: any | null
  initialSocieteId?: string
  initialUserId?: string
}

type StatusFilter = "all" | "active" | "inactive"

function formatDate(value?: string) {
  if (!value) return "-"
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value
  return parsedDate.toLocaleString("fr-FR")
}

function getSeverityVariant(severity: string) {
  if (severity === "CRITICAL") return "destructive"
  if (severity === "WARNING") return "secondary"
  return "outline"
}

export function AlertesPageClient({
  initialAlerts,
  initialStats,
  initialSocieteId,
  initialUserId,
}: AlertesPageClientProps) {
  const societeId = initialSocieteId || ""
  const userId = initialUserId || "system"

  const [alerts, setAlerts] = React.useState<any[]>(initialAlerts || [])
  const [stats, setStats] = React.useState<any | null>(initialStats || null)
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const fetchAlerts = React.useCallback(async () => {
    if (!societeId) {
      setAlerts([])
      setStats(null)
      return
    }

    setLoading(true)
    const now = new Date()
    const toDate = now.toISOString().split("T")[0]
    const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    const acknowledged =
      statusFilter === "active" ? false : statusFilter === "inactive" ? true : undefined

    const [alertsResult, statsResult] = await Promise.all([
      listAlerts({ societeId, acknowledged, page: 1, limit: 100 } as any),
      getAlertStats({ societeId, fromDate, toDate } as any),
    ])

    if (alertsResult.error) {
      toast.error(alertsResult.error)
    } else {
      setAlerts(alertsResult.data?.alerts || [])
    }

    if (statsResult.error) {
      toast.error(statsResult.error)
    } else {
      setStats(statsResult.data || null)
    }

    setLoading(false)
  }, [societeId, statusFilter])

  React.useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const filteredAlerts = React.useMemo(() => {
    if (!search) return alerts

    const query = search.toLowerCase()
    return alerts.filter((alert) => {
      const title = String(alert.title || "").toLowerCase()
      const message = String(alert.message || "").toLowerCase()
      const type = String(alert.alertType ?? alert.alert_type ?? "").toLowerCase()

      return title.includes(query) || message.includes(query) || type.includes(query)
    })
  }, [alerts, search])

  const handleToggleActive = async (alert: any, nextActive: boolean) => {
    const alreadyAcknowledged = Boolean(alert.acknowledged)

    if (nextActive) {
      toast.info("Reactivation non disponible, utilisez une nouvelle alerte")
      return
    }

    if (alreadyAcknowledged) return

    if (!societeId) {
      toast.error("Aucune societe active detectee")
      return
    }

    setLoading(true)
    const result = await acknowledgeAlert({
      id: alert.id,
      societeId,
      acknowledgedBy: userId,
    } as any)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Alerte desactivee")
      await fetchAlerts()
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Suivez les alertes et basculez leur etat actif/inactif.
        </p>
        <Button variant="outline" onClick={fetchAlerts} disabled={loading || !societeId}>
          <RefreshCw className="mr-2 size-4" />
          Actualiser
        </Button>
      </div>

      {!societeId && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Impossible de charger les alertes: aucune societe active.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats?.totalAlerts ?? stats?.total_alerts ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actives</CardDescription>
            <CardTitle className="text-2xl">
              {stats?.unacknowledged ?? stats?.unacknowledged_count ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critiques</CardDescription>
            <CardTitle className="text-2xl">{stats?.criticalCount ?? stats?.critical_count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Liste des alertes</CardTitle>
              <CardDescription>
                {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                Toutes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
              >
                Actives
              </Button>
              <Button
                type="button"
                size="sm"
                variant={statusFilter === "inactive" ? "default" : "outline"}
                onClick={() => setStatusFilter("inactive")}
              >
                Inactives
              </Button>
              <div className="relative w-full max-w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une alerte..."
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
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {search ? "Aucune alerte correspondante" : "Aucune alerte"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert) => {
                  const isActive = !Boolean(alert.acknowledged)
                  const severity = String(alert.severity || "INFO")
                  const createdAt = alert.createdAt ?? alert.created_at

                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.title || "-"}</TableCell>
                      <TableCell>{alert.alertType ?? alert.alert_type ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityVariant(severity) as any}>{severity}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate">{alert.message || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={(checked) => handleToggleActive(alert, checked)}
                            disabled={loading}
                          />
                          <span className="text-sm text-muted-foreground">
                            {isActive ? "Active" : "Inactive"}
                          </span>
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
    </div>
  )
}
