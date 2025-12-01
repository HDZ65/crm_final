"use client"

import * as React from "react"
import { MoreHorizontal, Play, Pause, XCircle, ArrowRightLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  useContractOrchestration,
  OrchestrationAction,
  ORCHESTRATION_ACTION_LABELS,
  ORCHESTRATION_ACTION_DESCRIPTIONS,
} from "@/hooks/contracts"
import { useAuth } from "@/hooks/auth"

interface ContractActionsMenuProps {
  contractId: string
  currentStatus?: string
  onActionComplete?: (action: OrchestrationAction) => void
}

interface ActionConfig {
  action: OrchestrationAction
  label: string
  description: string
  icon: React.ReactNode
  variant: "default" | "destructive"
  requiredRoles: string[]
}

const actionConfigs: ActionConfig[] = [
  {
    action: 'activate',
    label: ORCHESTRATION_ACTION_LABELS['activate'],
    description: ORCHESTRATION_ACTION_DESCRIPTIONS['activate'],
    icon: <Play className="mr-2 h-4 w-4" />,
    variant: 'default',
    requiredRoles: ['commercial', 'manager', 'admin'],
  },
  {
    action: 'suspend',
    label: ORCHESTRATION_ACTION_LABELS['suspend'],
    description: ORCHESTRATION_ACTION_DESCRIPTIONS['suspend'],
    icon: <Pause className="mr-2 h-4 w-4" />,
    variant: 'default',
    requiredRoles: ['commercial', 'manager', 'admin'],
  },
  {
    action: 'terminate',
    label: ORCHESTRATION_ACTION_LABELS['terminate'],
    description: ORCHESTRATION_ACTION_DESCRIPTIONS['terminate'],
    icon: <XCircle className="mr-2 h-4 w-4" />,
    variant: 'destructive',
    requiredRoles: ['manager', 'admin'],
  },
  {
    action: 'port-in',
    label: ORCHESTRATION_ACTION_LABELS['port-in'],
    description: ORCHESTRATION_ACTION_DESCRIPTIONS['port-in'],
    icon: <ArrowRightLeft className="mr-2 h-4 w-4" />,
    variant: 'default',
    requiredRoles: ['commercial', 'manager', 'admin'],
  },
]

export function ContractActionsMenu({
  contractId,
  currentStatus,
  onActionComplete,
}: ContractActionsMenuProps) {
  const { hasAnyRole } = useAuth()
  const {
    loading,
    activate,
    suspend,
    terminate,
    portIn,
  } = useContractOrchestration(contractId)

  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean
    action: OrchestrationAction | null
    config: ActionConfig | null
  }>({
    open: false,
    action: null,
    config: null,
  })
  const [reason, setReason] = React.useState("")

  const handleAction = (config: ActionConfig) => {
    setConfirmDialog({
      open: true,
      action: config.action,
      config,
    })
    setReason("")
  }

  const executeAction = async () => {
    if (!confirmDialog.action) return

    const actionMap: Record<OrchestrationAction, () => Promise<boolean>> = {
      'activate': () => activate({ reason }),
      'suspend': () => suspend({ reason }),
      'terminate': () => terminate({ reason }),
      'port-in': () => portIn({ reason }),
    }

    const success = await actionMap[confirmDialog.action]()

    if (success) {
      toast.success(`Contrat ${ORCHESTRATION_ACTION_LABELS[confirmDialog.action].toLowerCase()} avec succès`)
      onActionComplete?.(confirmDialog.action)
    } else {
      toast.error(`Erreur lors de l'opération`)
    }

    setConfirmDialog({ open: false, action: null, config: null })
  }

  // Filtrer les actions selon le statut actuel et les rôles
  const availableActions = actionConfigs.filter(config => {
    // Vérifier les rôles
    if (!hasAnyRole(config.requiredRoles)) return false

    // Filtrer selon le statut actuel
    if (currentStatus) {
      const status = currentStatus.toLowerCase()
      if (config.action === 'activate' && status === 'actif') return false
      if (config.action === 'suspend' && status === 'suspendu') return false
      if (config.action === 'terminate' && status === 'résilié') return false
    }

    return true
  })

  if (availableActions.length === 0) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">Actions du contrat</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableActions.map((config) => (
            <DropdownMenuItem
              key={config.action}
              onClick={() => handleAction(config)}
              className={config.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
            >
              {config.icon}
              {config.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, action: null, config: null })
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.config?.label} le contrat ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.config?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Motif (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Indiquez le motif de cette action..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={loading}
              className={confirmDialog.config?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  En cours...
                </>
              ) : (
                confirmDialog.config?.label
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
