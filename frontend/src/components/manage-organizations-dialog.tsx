"use client"

import * as React from "react"
import {
  Mail,
  MoreVertical,
  Trash2,
  UserPlus,
  Crown,
  Copy,
  Check,
  Link,
  Building2,
  ChevronRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type OrganizationRole = "owner" | "member"

interface Organization {
  id: string
  name: string
  plan: string
}

interface Member {
  id: string
  userId: string
  email: string
  name?: string
  avatarUrl?: string
  role: OrganizationRole
  joinedAt: Date
}

interface PendingInvitation {
  id: string
  email: string
  role: OrganizationRole
  invitedBy: string
  invitedAt: Date
  inviteUrl?: string
}

interface InvitationResult {
  id: string
  inviteUrl: string
  email: string
}

interface ManageOrganizationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  activeOrganizationId: string
  onOrganizationSelect: (orgId: string) => void
  currentUserRole: OrganizationRole
  members: Member[]
  pendingInvitations: PendingInvitation[]
  onInviteMember: (email: string, role: OrganizationRole) => Promise<InvitationResult | void>
  onUpdateMemberRole: (memberId: string, role: OrganizationRole) => Promise<void>
  onRemoveMember: (memberId: string) => Promise<void>
  onCancelInvitation: (invitationId: string) => Promise<void>
  loadingMembers?: boolean
}

const roleLabels: Record<OrganizationRole, string> = {
  owner: "Propriétaire",
  member: "Membre",
}

const roleDescriptions: Record<OrganizationRole, string> = {
  owner: "Tous les droits, peut gérer l'organisation et ses membres",
  member: "Peut créer et modifier les données",
}

const roleIcons: Record<OrganizationRole, React.ElementType> = {
  owner: Crown,
  member: UserPlus,
}

export function ManageOrganizationsDialog({
  open,
  onOpenChange,
  organizations,
  activeOrganizationId,
  onOrganizationSelect,
  currentUserRole,
  members,
  pendingInvitations,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onCancelInvitation,
  loadingMembers = false,
}: ManageOrganizationsDialogProps) {
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<OrganizationRole>("member")
  const [isInviting, setIsInviting] = React.useState(false)
  const [lastInviteUrl, setLastInviteUrl] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [inviteError, setInviteError] = React.useState<string | null>(null)

  const activeOrganization = organizations.find((o) => o.id === activeOrganizationId)

  // Reset state when organization changes
  React.useEffect(() => {
    setInviteEmail("")
    setInviteRole("member")
    setLastInviteUrl(null)
    setInviteError(null)
  }, [activeOrganizationId])

  // Seul le owner peut inviter et gérer les membres
  const canInviteMembers = currentUserRole === "owner"
  const canManageMembers = currentUserRole === "owner"

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !canInviteMembers) return

    setIsInviting(true)
    setLastInviteUrl(null)
    setInviteError(null)
    try {
      const result = await onInviteMember(inviteEmail, inviteRole)
      if (result?.inviteUrl) {
        setLastInviteUrl(result.inviteUrl)
        toast.success(`Invitation créée pour ${inviteEmail}`)
      } else {
        toast.success(`Invitation envoyée à ${inviteEmail}`)
      }
      setInviteEmail("")
      setInviteRole("member")
    } catch (error: unknown) {
      const err = error as { message?: string }
      const message = (err?.message || "").toLowerCase()

      if (message.includes("déjà en attente") || message.includes("deja en attente")) {
        setInviteError(`Une invitation est déjà en attente pour cet email`)
      } else if (message.includes("déjà membre") || message.includes("deja membre")) {
        setInviteError(`Cet utilisateur est déjà membre de l'organisation`)
      } else if (message.includes("email") && message.includes("invalid")) {
        setInviteError("Adresse email invalide")
      } else {
        setInviteError(err?.message || "Erreur lors de l'invitation")
      }
    } finally {
      setIsInviting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!lastInviteUrl) return
    try {
      await navigator.clipboard.writeText(lastInviteUrl)
      setCopied(true)
      toast.success("Lien copié dans le presse-papiers")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Erreur lors de la copie")
    }
  }

  const handleRoleChange = async (memberId: string, newRole: OrganizationRole) => {
    try {
      await onUpdateMemberRole(memberId, newRole)
      toast.success("Rôle mis à jour")
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du rôle")
      console.error(error)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName?: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberName || "ce membre"} ?`)) {
      return
    }

    try {
      await onRemoveMember(memberId)
      toast.success("Membre retiré")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
      console.error(error)
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    try {
      await onCancelInvitation(invitationId)
      toast.success(`Invitation à ${email} annulée`)
    } catch (error) {
      toast.error("Erreur lors de l'annulation")
      console.error(error)
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || "?"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-h-[85vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar - Liste des organisations */}
          <div className="w-64 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">Mes organisations</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {organizations.length} organisation{organizations.length > 1 ? "s" : ""}
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => onOrganizationSelect(org.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      org.id === activeOrganizationId
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md",
                        org.id === activeOrganizationId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <Building2 className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.plan}</p>
                    </div>
                    {org.id === activeOrganizationId && (
                      <ChevronRight className="size-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Contenu principal - Membres de l'organisation sélectionnée */}
          <div className="flex-1 flex flex-col min-w-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                {activeOrganization?.name || "Organisation"}
              </DialogTitle>
              <DialogDescription>
                Gérez les membres et les invitations de cette organisation
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                    {/* Formulaire d'invitation - Seul le owner peut inviter */}
                    {canInviteMembers && (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <UserPlus className="size-4" />
                          Inviter un nouveau membre
                        </h3>
                        <form onSubmit={handleInvite} className="space-y-3">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label htmlFor="invite-email" className="sr-only">
                                Email
                              </Label>
                              <Input
                                id="invite-email"
                                type="email"
                                placeholder="email@exemple.com"
                                value={inviteEmail}
                                onChange={(e) => {
                                  setInviteEmail(e.target.value)
                                  setInviteError(null)
                                }}
                                className={inviteError ? "border-red-500" : ""}
                                required
                              />
                            </div>
                            <Select
                              value={inviteRole}
                              onValueChange={(value) => setInviteRole(value as OrganizationRole)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">
                                  {roleLabels.member}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
                          <Button type="submit" disabled={isInviting} className="w-full">
                            {isInviting ? "Envoi..." : "Envoyer l'invitation"}
                          </Button>
                        </form>

                        {/* Affichage du lien d'invitation */}
                        {lastInviteUrl && (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Link className="size-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                Lien d&apos;invitation créé
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={lastInviteUrl}
                                readOnly
                                className="text-xs bg-white dark:bg-black"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopyLink}
                                className="shrink-0"
                              >
                                {copied ? (
                                  <Check className="size-4 text-green-600" />
                                ) : (
                                  <Copy className="size-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Partagez ce lien avec la personne invitée
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Invitations en attente */}
                    {pendingInvitations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3">
                          Invitations en attente ({pendingInvitations.length})
                        </h3>
                        <div className="space-y-2">
                          {pendingInvitations.map((invitation) => (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9">
                                  <AvatarFallback className="bg-muted">
                                    <Mail className="size-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{invitation.email}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Invité le{" "}
                                    {new Date(invitation.invitedAt).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{roleLabels[invitation.role] || invitation.role}</Badge>
                                {canInviteMembers && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      handleCancelInvitation(invitation.id, invitation.email)
                                    }
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    )}

                    {/* Liste des membres */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">
                        Membres actifs ({members.length})
                      </h3>
                      <div className="space-y-2">
                        {members.map((member) => {
                          const RoleIcon = roleIcons[member.role] || UserPlus
                          // Le owner peut modifier les membres (mais pas lui-même)
                          const canModifyThisMember =
                            canManageMembers && member.role !== "owner"

                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="size-10">
                                  <AvatarImage src={member.avatarUrl} />
                                  <AvatarFallback>
                                    {getInitials(member.name, member.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {member.name || member.email}
                                  </p>
                                  {member.name && (
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="gap-1">
                                  <RoleIcon className="size-3" />
                                  {roleLabels[member.role] || member.role}
                                </Badge>

                                {canModifyThisMember && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreVertical className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() =>
                                          handleRemoveMember(member.id, member.name)
                                        }
                                      >
                                        <Trash2 className="size-4 mr-2" />
                                        Retirer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Légende des rôles */}
                    <div className="border-t pt-4">
                      <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                        Description des rôles
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(roleDescriptions).map(([role, description]) => {
                          const RoleIcon = roleIcons[role as OrganizationRole]
                          return (
                            <div key={role} className="flex items-start gap-2">
                              <RoleIcon className="size-3.5 mt-0.5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {roleLabels[role as OrganizationRole]}
                                </p>
                                <p className="text-muted-foreground">{description}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
