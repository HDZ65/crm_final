"use client";

import React from "react";
import { Plus, AlertTriangle, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils/csv-export";

interface QuickActionsProps {
  dashboardData?: {
    kpis?: Record<string, unknown>;
    companies?: Record<string, unknown>[];
    chartData?: Record<string, unknown>[];
  };
}

export function QuickActions({ dashboardData }: QuickActionsProps = {}) {
  const handleExportCSV = () => {
    try {
      // Prepare export data from dashboard
      const exportData: Record<string, unknown>[] = [];

      // Add KPIs as first row if available
      if (dashboardData?.kpis) {
        exportData.push({
          type: "KPIs",
          ...dashboardData.kpis,
        });
      }

      // Add company stats if available
      if (dashboardData?.companies && dashboardData.companies.length > 0) {
        exportData.push(
          ...dashboardData.companies.map((company) => ({
            type: "Société",
            ...company,
          }))
        );
      }

      // Add chart data if available
      if (dashboardData?.chartData && dashboardData.chartData.length > 0) {
        exportData.push(
          ...dashboardData.chartData.map((item) => ({
            type: "Données",
            ...item,
          }))
        );
      }

      // If no data available, create a placeholder
      if (exportData.length === 0) {
        exportData.push({
          message: "Aucune donnée disponible pour l'export",
          timestamp: new Date().toISOString(),
        });
      }

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const filename = `rapport-dashboard-${dateStr}.csv`;

      // Export to CSV
      exportToCSV(exportData, filename);

      toast.success("Rapport exporté", {
        description: `Le fichier ${filename} a été téléchargé.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur d'export", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'exporter le rapport.",
      });
    }
  };

  const actions = [
    {
      label: "Nouveau contrat",
      icon: Plus,
      href: "/contrats/nouveau",
      variant: "outline" as const,
    },
    {
      label: "Voir impayés",
      icon: AlertTriangle,
      href: "/facturation?statut=impaye",
      variant: "outline" as const,
    },
    {
      label: "Relancer client",
      icon: Mail,
      href: "#",
      variant: "outline" as const,
      onClick: () => {
        // TODO: Open email composer dialog
        console.log("Open email composer");
      },
    },
    {
      label: "Exporter rapport",
      icon: Download,
      href: "#",
      variant: "outline" as const,
      onClick: handleExportCSV,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.variant}
          size="sm"
          className="flex-1 min-w-[140px] justify-start gap-2"
          asChild={!action.onClick}
          onClick={action.onClick}
        >
          {action.onClick ? (
            <>
              <action.icon className="h-4 w-4" />
              {action.label}
            </>
          ) : (
            <Link href={action.href}>
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          )}
        </Button>
      ))}
    </div>
  );
}
