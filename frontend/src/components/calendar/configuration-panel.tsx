"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type {
  SystemDebitConfiguration,
  HolidayZone,
} from "@proto/calendar/calendar";
import {
  DebitDateMode,
  DebitBatch,
  DateShiftStrategy,
} from "@proto/calendar/calendar";
import {
  DebitDateModeLabels,
  DebitBatchLabels,
  DateShiftStrategyLabels,
} from "@/lib/ui/labels/calendar";
import { updateSystemConfig } from "@/actions/calendar-config";

interface ConfigurationPanelProps {
  initialSystemConfig: SystemDebitConfiguration | null;
  initialZones: HolidayZone[];
  organisationId: string;
}

export function ConfigurationPanel({
  initialSystemConfig,
  initialZones,
  organisationId,
}: ConfigurationPanelProps) {
  const [config, setConfig] = useState(initialSystemConfig);
  const [saving, setSaving] = useState(false);

  const handleSaveSystemConfig = async () => {
    if (!config) return;

    setSaving(true);
    const result = await updateSystemConfig({
      organisationId,
      defaultMode: config.defaultMode,
      defaultBatch: config.defaultBatch,
      defaultFixedDay: config.defaultFixedDay,
      shiftStrategy: config.shiftStrategy,
      holidayZoneId: config.holidayZoneId,
      cutoffConfigId: config.cutoffConfigId,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Configuration système mise à jour");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration des prélèvements</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="systeme">
          <TabsList className="mb-4">
            <TabsTrigger value="systeme">Système</TabsTrigger>
            <TabsTrigger value="societe">Société</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="contrat">Contrat</TabsTrigger>
          </TabsList>

          <TabsContent value="systeme">
            {config ? (
              <div className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <Label>Mode de calcul</Label>
                  <Select
                    value={config.defaultMode.toString()}
                    onValueChange={(v) =>
                      setConfig({ ...config, defaultMode: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DebitDateModeLabels)
                        .filter(([k]) => k !== "0")
                        .map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {config.defaultMode === DebitDateMode.DEBIT_DATE_MODE_BATCH && (
                  <div className="space-y-2">
                    <Label>Lot par défaut</Label>
                    <Select
                      value={config.defaultBatch.toString()}
                      onValueChange={(v) =>
                        setConfig({ ...config, defaultBatch: parseInt(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DebitBatchLabels)
                          .filter(([k]) => k !== "0")
                          .map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {config.defaultMode === DebitDateMode.DEBIT_DATE_MODE_FIXED_DAY && (
                  <div className="space-y-2">
                    <Label>Jour fixe du mois</Label>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      value={config.defaultFixedDay}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          defaultFixedDay: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Choisir un jour entre 1 et 28 pour éviter les problèmes de fin de mois
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Stratégie de report</Label>
                  <Select
                    value={config.shiftStrategy.toString()}
                    onValueChange={(v) =>
                      setConfig({ ...config, shiftStrategy: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DateShiftStrategyLabels)
                        .filter(([k]) => k !== "0")
                        .map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Action à prendre si la date calculée tombe un weekend ou jour férié
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Zone de jours fériés</Label>
                  <Select
                    value={config.holidayZoneId || ""}
                    onValueChange={(v) =>
                      setConfig({ ...config, holidayZoneId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} ({zone.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveSystemConfig} disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Aucune configuration système. Veuillez en créer une.
              </p>
            )}
          </TabsContent>

          <TabsContent value="societe">
            <p className="text-muted-foreground">
              Configuration par société - À implémenter
            </p>
          </TabsContent>

          <TabsContent value="client">
            <p className="text-muted-foreground">
              Configuration par client - À implémenter
            </p>
          </TabsContent>

          <TabsContent value="contrat">
            <p className="text-muted-foreground">
              Configuration par contrat - À implémenter
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
