"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import type { HolidayZone, Holiday } from "@proto/calendar/calendar";
import { HolidayType } from "@proto/calendar/calendar";
import { HolidayTypeLabels } from "@/lib/ui/labels/calendar";
import {
  listHolidayZones,
  createHolidayZone,
  updateHolidayZone,
  deleteHolidayZone,
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  importHolidaysByCountry,
} from "@/actions/calendar-holidays";

interface HolidaysManagerProps {
  initialZones: HolidayZone[];
  organisationId: string;
}

export function HolidaysManager({
  initialZones,
  organisationId,
}: HolidaysManagerProps) {
  const [zones, setZones] = useState<HolidayZone[]>(initialZones);
  const [selectedZone, setSelectedZone] = useState<HolidayZone | null>(
    initialZones[0] || null
  );
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<HolidayZone | null>(null);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const loadHolidays = useCallback(async () => {
    if (!selectedZone) return;

    setLoadingHolidays(true);
    const result = await listHolidays({
      holidayZoneId: selectedZone.id,
      year,
    });
    if (result.data) {
      setHolidays(result.data.data);
    }
    setLoadingHolidays(false);
  }, [selectedZone, year]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleSaveZone = async (formData: FormData) => {
    const data = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      countryCode: formData.get("countryCode") as string,
      regionCode: (formData.get("regionCode") as string) || undefined,
    };

    if (editingZone) {
      const result = await updateHolidayZone({
        id: editingZone.id,
        ...data,
        isActive: editingZone.isActive,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setZones(zones.map((z) => (z.id === editingZone.id ? result.data! : z)));
        toast.success("Zone mise à jour");
        setZoneDialogOpen(false);
        setEditingZone(null);
      }
    } else {
      const result = await createHolidayZone({
        organisationId,
        ...data,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setZones([...zones, result.data]);
        toast.success("Zone créée");
        setZoneDialogOpen(false);
      }
    }
  };

  const handleDeleteZone = async (zone: HolidayZone) => {
    if (!confirm(`Supprimer la zone "${zone.name}" ?`)) return;

    const result = await deleteHolidayZone(zone.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      setZones(zones.filter((z) => z.id !== zone.id));
      if (selectedZone?.id === zone.id) {
        setSelectedZone(zones[0] || null);
      }
      toast.success("Zone supprimée");
    }
  };

  const handleSaveHoliday = async (formData: FormData) => {
    if (!selectedZone) return;

    const data = {
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      holidayType: parseInt(formData.get("holidayType") as string),
      isRecurring: formData.get("isRecurring") === "on",
    };

    if (editingHoliday) {
      const result = await updateHoliday({
        id: editingHoliday.id,
        ...data,
        isActive: editingHoliday.isActive,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setHolidays(holidays.map((h) => (h.id === editingHoliday.id ? result.data! : h)));
        toast.success("Jour férié mis à jour");
        setHolidayDialogOpen(false);
        setEditingHoliday(null);
      }
    } else {
      const result = await createHoliday({
        holidayZoneId: selectedZone.id,
        ...data,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setHolidays([...holidays, result.data]);
        toast.success("Jour férié créé");
        setHolidayDialogOpen(false);
      }
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    if (!confirm(`Supprimer "${holiday.name}" ?`)) return;

    const result = await deleteHoliday(holiday.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      setHolidays(holidays.filter((h) => h.id !== holiday.id));
      toast.success("Jour férié supprimé");
    }
  };

  const handleImport = async (formData: FormData) => {
    const result = await importHolidaysByCountry({
      organisationId,
      countryCode: formData.get("countryCode") as string,
      year: parseInt(formData.get("year") as string),
      includeRegional: formData.get("includeRegional") === "on",
    });

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      toast.success(`${result.data.importedCount} jours fériés importés`);
      setImportDialogOpen(false);
      const zonesResult = await listHolidayZones({ organisationId });
      if (zonesResult.data) {
        setZones(zonesResult.data.data);
      }
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Zones de jours fériés</CardTitle>
          <div className="flex gap-2">
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Importer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importer les jours fériés</DialogTitle>
                </DialogHeader>
                <form action={handleImport} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Pays</Label>
                    <Select name="countryCode" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="DE">Allemagne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Année</Label>
                    <Input
                      type="number"
                      name="year"
                      defaultValue={new Date().getFullYear()}
                      min={2020}
                      max={2030}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="includeRegional" id="includeRegional" />
                    <Label htmlFor="includeRegional">Inclure les jours fériés régionaux</Label>
                  </div>
                  <Button type="submit">Importer</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditingZone(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingZone ? "Modifier la zone" : "Nouvelle zone"}
                  </DialogTitle>
                </DialogHeader>
                <form action={handleSaveZone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                      name="code"
                      placeholder="FR"
                      defaultValue={editingZone?.code}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      name="name"
                      placeholder="France"
                      defaultValue={editingZone?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="countryCode">Code pays (ISO)</Label>
                    <Input
                      name="countryCode"
                      placeholder="FR"
                      defaultValue={editingZone?.countryCode}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regionCode">Code région (optionnel)</Label>
                    <Input
                      name="regionCode"
                      placeholder="ALS"
                      defaultValue={editingZone?.regionCode}
                    />
                  </div>
                  <Button type="submit">
                    {editingZone ? "Enregistrer" : "Créer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {zones.length === 0 ? (
              <p className="text-muted-foreground">Aucune zone configurée</p>
            ) : (
              zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                    selectedZone?.id === zone.id ? "border-primary bg-muted" : ""
                  }`}
                  onClick={() => setSelectedZone(zone)}
                >
                  <div>
                    <p className="font-medium">{zone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {zone.code} - {zone.countryCode}
                      {zone.regionCode && ` / ${zone.regionCode}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={zone.isActive ? "default" : "secondary"}>
                      {zone.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingZone(zone);
                        setZoneDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteZone(zone);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Jours fériés
            {selectedZone && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                - {selectedZone.name}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!selectedZone} onClick={() => setEditingHoliday(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingHoliday ? "Modifier le jour férié" : "Nouveau jour férié"}
                  </DialogTitle>
                </DialogHeader>
                <form action={handleSaveHoliday} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      name="date"
                      defaultValue={editingHoliday?.date}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                      name="name"
                      placeholder="Jour de l'An"
                      defaultValue={editingHoliday?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="holidayType">Type</Label>
                    <Select
                      name="holidayType"
                      defaultValue={editingHoliday?.holidayType?.toString() || "1"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(HolidayTypeLabels)
                          .filter(([k]) => k !== "0")
                          .map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isRecurring"
                      id="isRecurring"
                      defaultChecked={editingHoliday?.isRecurring}
                    />
                    <Label htmlFor="isRecurring">Récurrent chaque année</Label>
                  </div>
                  <Button type="submit">
                    {editingHoliday ? "Enregistrer" : "Créer"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedZone ? (
            <p className="text-muted-foreground">
              Sélectionnez une zone pour voir les jours fériés
            </p>
          ) : loadingHolidays ? null : holidays.length === 0 ? (
            <p className="text-muted-foreground">
              Aucun jour férié pour cette zone en {year}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>
                      {new Date(holiday.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      {holiday.name}
                      {holiday.isRecurring && (
                        <Badge variant="outline" className="ml-2">
                          Récurrent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {HolidayTypeLabels[holiday.holidayType as HolidayType]}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingHoliday(holiday);
                            setHolidayDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteHoliday(holiday)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
