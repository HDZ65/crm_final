"use client"

import * as React from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  Zap,
  ArrowLeft,
  Loader2,
  Save,
  ChevronDown,
  Check,
  Sparkles,
  Users,
  Contact,
  MapPin,
  MessageSquare,
  Link as LinkIcon,
  FileText,
  Receipt,
  BadgeMinus,
  FilePen,
  CreditCard,
  BarChart3,
} from "lucide-react"
import {
  INTERFAST_MODULES,
  getModuleOperationIds,
  getAllOperationIds,
  getRecommendedOperationIds,
  isModuleFullyEnabled,
  isModulePartiallyEnabled,
  getModuleEnabledCount,
  getModuleColorClasses,
  type InterfastModule,
} from "@/data/interfast-modules"
import { saveInterfastEnabledRoutes } from "@/actions/interfast"
import type { InterfastConfig } from "@proto/interfast/interfast"

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Contact,
  MapPin,
  MessageSquare,
  Link: LinkIcon,
  FileText,
  Receipt,
  BadgeMinus,
  FilePen,
  CreditCard,
  BarChart3,
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InterfastPageClientProps {
  activeOrgId?: string | null
  initialConfig: InterfastConfig | null
  initialEnabledRoutes: string[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InterfastPageClient({
  activeOrgId,
  initialConfig,
  initialEnabledRoutes,
}: InterfastPageClientProps) {
  const [enabledRoutes, setEnabledRoutes] = React.useState<Set<string>>(
    () => new Set(initialEnabledRoutes)
  )
  const [saving, setSaving] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  const initialRoutesRef = React.useRef(new Set(initialEnabledRoutes))

  // Stats
  const totalModules = INTERFAST_MODULES.length
  const enabledModules = INTERFAST_MODULES.filter((m) =>
    isModuleFullyEnabled(m, enabledRoutes)
  ).length

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const toggleModule = React.useCallback(
    (mod: InterfastModule) => {
      setEnabledRoutes((prev) => {
        const next = new Set(prev)
        const ids = getModuleOperationIds(mod)
        const allEnabled = ids.every((id) => next.has(id))

        if (allEnabled) {
          for (const id of ids) next.delete(id)
        } else {
          for (const id of ids) next.add(id)
        }
        return next
      })
      setHasChanges(true)
    },
    []
  )

  const toggleCapability = React.useCallback(
    (operationIds: string[]) => {
      setEnabledRoutes((prev) => {
        const next = new Set(prev)
        const allEnabled = operationIds.every((id) => next.has(id))

        if (allEnabled) {
          for (const id of operationIds) next.delete(id)
        } else {
          for (const id of operationIds) next.add(id)
        }
        return next
      })
      setHasChanges(true)
    },
    []
  )

  const applyRecommended = React.useCallback(() => {
    setEnabledRoutes(new Set(getRecommendedOperationIds()))
    setHasChanges(true)
  }, [])

  const enableAll = React.useCallback(() => {
    setEnabledRoutes(new Set(getAllOperationIds()))
    setHasChanges(true)
  }, [])

  const disableAll = React.useCallback(() => {
    setEnabledRoutes(new Set())
    setHasChanges(true)
  }, [])

  const handleSave = React.useCallback(async () => {
    if (!activeOrgId) {
      toast.error("Organisation non trouvée")
      return
    }

    setSaving(true)
    const result = await saveInterfastEnabledRoutes(
      activeOrgId,
      Array.from(enabledRoutes)
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        `${enabledModules} module${enabledModules !== 1 ? "s" : ""} activé${enabledModules !== 1 ? "s" : ""} avec succès`
      )
      initialRoutesRef.current = new Set(enabledRoutes)
      setHasChanges(false)
    }
    setSaving(false)
  }, [activeOrgId, enabledRoutes, enabledModules])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <TooltipProvider>
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/parametres/integrations">
              <Button variant="ghost" size="icon" className="size-8">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-sky-600 dark:text-sky-400" />
                <h1 className="text-2xl font-bold tracking-tight">
                  InterFast
                </h1>
                {initialConfig?.active && (
                  <Badge variant="default" className="ml-1">
                    Connecté
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5">
                Choisissez les fonctionnalités à activer dans votre CRM.
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="shrink-0"
          >
            {saving ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>

        {/* Onboarding banner */}
        {enabledRoutes.size === 0 && (
          <Card className="border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-sky-100 dark:bg-sky-900/50 p-2.5 shrink-0">
                  <Sparkles className="size-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">
                    Bienvenue dans l&apos;intégration InterFast
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Activez les modules dont vous avez besoin. Vous pouvez
                    commencer avec notre sélection recommandée et ajuster ensuite.
                  </p>
                  <Button size="sm" onClick={applyRecommended}>
                    <Sparkles className="size-3.5 mr-2" />
                    Appliquer la sélection recommandée
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary bar */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground text-lg">
              {enabledModules}
            </span>{" "}
            / {totalModules} modules activés
          </div>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={applyRecommended}>
              <Sparkles className="size-3.5 mr-1.5" />
              Recommandés
            </Button>
            <Button variant="ghost" size="sm" onClick={enableAll}>
              Tout activer
            </Button>
            <Button variant="ghost" size="sm" onClick={disableAll}>
              Tout désactiver
            </Button>
          </div>
        </div>

        {/* Module cards */}
        <div className="grid gap-4">
          {INTERFAST_MODULES.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              enabledRoutes={enabledRoutes}
              onToggleModule={toggleModule}
              onToggleCapability={toggleCapability}
            />
          ))}
        </div>

        {/* Sticky save bar */}
        {hasChanges && (
          <div className="sticky bottom-4 z-10">
            <Card className="border-primary/20 bg-background/95 backdrop-blur-sm shadow-lg">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-muted-foreground">
                    Modifications non enregistrées &mdash;{" "}
                    <span className="font-medium text-foreground">
                      {enabledModules} module{enabledModules !== 1 ? "s" : ""}
                    </span>{" "}
                    activé{enabledModules !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEnabledRoutes(new Set(initialRoutesRef.current))
                      setHasChanges(false)
                    }}
                  >
                    Annuler
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="size-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </TooltipProvider>
  )
}

// ---------------------------------------------------------------------------
// ModuleCard
// ---------------------------------------------------------------------------

interface ModuleCardProps {
  module: InterfastModule
  enabledRoutes: Set<string>
  onToggleModule: (mod: InterfastModule) => void
  onToggleCapability: (operationIds: string[]) => void
}

function ModuleCard({
  module: mod,
  enabledRoutes,
  onToggleModule,
  onToggleCapability,
}: ModuleCardProps) {
  const [open, setOpen] = React.useState(false)

  const Icon = ICON_MAP[mod.icon] ?? Zap
  const colors = getModuleColorClasses(mod.color)
  const fullyEnabled = isModuleFullyEnabled(mod, enabledRoutes)
  const partiallyEnabled = isModulePartiallyEnabled(mod, enabledRoutes)
  const enabledCount = getModuleEnabledCount(mod, enabledRoutes)
  const totalCaps = mod.capabilities.length

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card
        className={`transition-all ${
          fullyEnabled
            ? `${colors.border} ${colors.bg}`
            : partiallyEnabled
              ? "border-border bg-muted/20"
              : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={`rounded-lg p-2.5 shrink-0 ${
                fullyEnabled ? colors.bg : "bg-muted/50"
              }`}
            >
              <Icon
                className={`size-5 ${
                  fullyEnabled ? colors.icon : "text-muted-foreground"
                }`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{mod.name}</CardTitle>
                {mod.recommended && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] gap-1 px-1.5 py-0"
                  >
                    <Sparkles className="size-2.5" />
                    Recommandé
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-0.5 line-clamp-1">
                {mod.description}
              </CardDescription>
            </div>

            {/* Stats + Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              {(fullyEnabled || partiallyEnabled) && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {enabledCount}/{totalCaps} fonctionnalités
                </span>
              )}

              <Switch
                checked={fullyEnabled}
                onCheckedChange={() => onToggleModule(mod)}
              />
            </div>
          </div>
        </CardHeader>

        {/* Expandable detail */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-6 pb-3 cursor-pointer"
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
            {open ? "Masquer" : "Voir"} les {totalCaps} fonctionnalités
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <CardContent className="pt-3 pb-4">
            <div className="space-y-1">
              {mod.capabilities.map((cap, idx) => {
                const capEnabled = cap.operationIds.every((id) =>
                  enabledRoutes.has(id)
                )

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                      capEnabled
                        ? "bg-primary/[0.04]"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {/* Checkbox-like indicator */}
                    <div
                      className={`size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        capEnabled
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {capEnabled && <Check className="size-3" />}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{cap.label}</span>
                      {cap.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cap.detail}
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    <Switch
                      checked={capEnabled}
                      onCheckedChange={() =>
                        onToggleCapability(cap.operationIds)
                      }
                      className="shrink-0 scale-90"
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
