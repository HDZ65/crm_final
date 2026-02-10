"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw } from "lucide-react";
import type { CalendarAuditLog } from "@proto/calendar/calendar";
import { AuditSource } from "@proto/calendar/calendar";
import { AuditSourceLabels } from "@/lib/ui/labels/calendar";
import { getAuditLogs } from "@/actions/calendar-admin";

interface AuditLogsTableProps {
  organisationId: string;
}

const ACTION_BADGES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

export function AuditLogsTable({ organisationId }: AuditLogsTableProps) {
  const [logs, setLogs] = useState<CalendarAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    entityType: "",
    source: "",
    startDate: "",
    endDate: "",
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const result = await getAuditLogs({
      organisationId,
      entityType: filters.entityType || undefined,
      source: filters.source ? parseInt(filters.source) : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page,
      limit: 20,
    });
    if (result.data) {
      setLogs(result.data.data);
      setTotalPages(result.data.totalPages);
    }
    setLoading(false);
  }, [organisationId, filters, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value === "_all" ? "" : value });
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Journal d&apos;audit</CardTitle>
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Rafraîchir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              value={filters.entityType || "_all"}
              onValueChange={(v) => handleFilterChange("entityType", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type d'entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tous les types</SelectItem>
                <SelectItem value="SYSTEM_CONFIG">Configuration système</SelectItem>
                <SelectItem value="COMPANY_CONFIG">Configuration société</SelectItem>
                <SelectItem value="CLIENT_CONFIG">Configuration client</SelectItem>
                <SelectItem value="CONTRACT_CONFIG">Configuration contrat</SelectItem>
                <SelectItem value="HOLIDAY_ZONE">Zone de jours fériés</SelectItem>
                <SelectItem value="HOLIDAY">Jour férié</SelectItem>
                <SelectItem value="VOLUME_THRESHOLD">Seuil de volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Select
              value={filters.source || "_all"}
              onValueChange={(v) => handleFilterChange("source", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Toutes les sources</SelectItem>
                {Object.entries(AuditSourceLabels)
                  .filter(([k]) => k !== "0")
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              placeholder="Date début"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              placeholder="Date fin"
            />
          </div>
        </div>

        {loading ? null : logs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucun log d&apos;audit trouvé
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type entité</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Résumé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_BADGES[log.action] || "outline"}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>
                      {AuditSourceLabels[log.source as AuditSource]}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.changeSummary}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
