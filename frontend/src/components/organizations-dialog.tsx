"use client"

import * as React from "react"
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  Settings,
  Crown,
  Trash2,
  Copy,
  Check,
  Link,
  Plus,
  MoreVertical,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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

interface OrganizationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  activeOrganizationId: string
  onOrganizationSelect: (orgId: string) => void
  onCreateOrganization?: () => void
  currentUserRole: OrganizationRole
  members: Member[]
  pendingInvitations: PendingInvitation[]
  onInviteMember: (email: string, role: OrganizationRole) => Promise<InvitationResult | void>
  onUpdateMemberRole: (memberId: string, role: OrganizationRole) => Promise<void>
  onRemoveMember: (memberId: string) => Promise<void>
  onCancelInvitation: (invitationId: string) => Promise<void>
  loadingMembers?: boolean
}

const navItems = [
  { id: "organisations", name: "Mes organisations", icon: Building2 },
  { id: "membres", name: "Membres", icon: Users },
  { id: "invitations", name: "Invitations", icon: UserPlus },
  { id: "parametres", name: "Paramètres", icon: Settings },
]

const roleLabels: Record<OrganizationRole, string> = {
  owner: "Propriétaire",
  member: "Membre",
}

const roleIcons: Record<OrganizationRole, React.ElementType> = {
  owner: Crown,
  member: Users,
}

function OrganisationsSection({
  organizations,
  activeOrganizationId,
  onOrganizationSelect,
  onCreateOrganization,
}: {
  organizations: Organization[]
  activeOrganizationId: string
  onOrganizationSelect: (orgId: string) => void
  onCreateOrganization?: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Mes organisations</h3>
        <p className="text-sm text-muted-foreground">
          Gérez vos organisations et changez d&apos;espace de travail.
        </p>
      </div>

      <div className="space-y-2">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => onOrganizationSelect(org.id)}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors",
              org.id === activeOrganizationId
                ? "border-primary bg-primary/5"
                : "hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                org.id === activeOrganizationId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <Building2 className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{org.name}</p>
              <p className="text-sm text-muted-foreground">{org.plan}</p>
            </div>
            {org.id === activeOrganizationId && (
              <Badge variant="secondary">Active</Badge>
            )}
          </button>
        ))}
      </div>

      {onCreateOrganization && (
        <Button variant="outline" className="w-full" onClick={onCreateOrganization}>
          <Plus className="size-4 mr-2" />
          Créer une organisation
        </Button>
      )}
    </div>
  )
}

function MembresSection({
  members,
  currentUserRole,
  onRemoveMember,
}: {
  members: Member[]
  currentUserRole: OrganizationRole
  onRemoveMember: (memberId: string) => Promise<void>
}) {
  const canManageMembers = currentUserRole === "owner"

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

  const handleRemoveMember = async (memberId: string, memberName?: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberName || "ce membre"} ?`)) {
      return
    }
    try {
      await onRemoveMember(memberId)
      toast.success("Membre retiré")
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Membres</h3>
        <p className="text-sm text-muted-foreground">
          {members.length} membre{members.length > 1 ? "s" : ""} dans cette organisation.
        </p>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const RoleIcon = roleIcons[member.role]
          const canModifyThisMember = canManageMembers && member.role !== "owner"

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={member.avatarUrl} />
                  <AvatarFallback>
                    {getInitials(member.name, member.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name || member.email}</p>
                  {member.name && (
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <RoleIcon className="size-3" />
                  {roleLabels[member.role]}
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
                        onClick={() => handleRemoveMember(member.id, member.name)}
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

      {members.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="size-12 mx-auto mb-2 opacity-50" />
          <p>Aucun membre pour le moment</p>
        </div>
      )}
    </div>
  )
}

function InvitationsSection({
  pendingInvitations,
  currentUserRole,
  onInviteMember,
  onCancelInvitation,
}: {
  pendingInvitations: PendingInvitation[]
  currentUserRole: OrganizationRole
  onInviteMember: (email: string, role: OrganizationRole) => Promise<InvitationResult | void>
  onCancelInvitation: (invitationId: string) => Promise<void>
}) {
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState<OrganizationRole>("member")
  const [isInviting, setIsInviting] = React.useState(false)
  const [lastInviteUrl, setLastInviteUrl] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [inviteError, setInviteError] = React.useState<string | null>(null)

  const canInviteMembers = currentUserRole === "owner"

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
      toast.success("Lien copié")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Erreur lors de la copie")
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    try {
      await onCancelInvitation(invitationId)
      toast.success(`Invitation à ${email} annulée`)
    } catch {
      toast.error("Erreur lors de l'annulation")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Invitations</h3>
        <p className="text-sm text-muted-foreground">
          Invitez de nouveaux membres à rejoindre votre organisation.
        </p>
      </div>

      {canInviteMembers ? (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <UserPlus className="size-4" />
            Inviter un membre
          </h4>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value)
                    setInviteError(null)
                  }}
                  className={inviteError ? "border-destructive" : ""}
                  required
                />
              </div>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as OrganizationRole)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{roleLabels.member}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
            <Button type="submit" disabled={isInviting} className="w-full">
              {isInviting ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </form>

          {lastInviteUrl && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Link className="size-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Lien d&apos;invitation créé
                </span>
              </div>
              <div className="flex gap-2">
                <Input value={lastInviteUrl} readOnly className="text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 text-center text-muted-foreground">
          <p>Seul le propriétaire peut inviter des membres.</p>
        </div>
      )}

      <Separator />

      <div>
        <h4 className="font-medium mb-3">
          Invitations en attente ({pendingInvitations.length})
        </h4>
        {pendingInvitations.length > 0 ? (
          <div className="space-y-2">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-muted">
                      <Mail className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invité le {new Date(invitation.invitedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
                  {canInviteMembers && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="size-10 mx-auto mb-2 opacity-50" />
            <p>Aucune invitation en attente</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ParametresSection({
  organization,
}: {
  organization?: Organization
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paramètres de l&apos;organisation</h3>
        <p className="text-sm text-muted-foreground">
          Configurez les paramètres de votre organisation.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
          <Input id="org-name" defaultValue={organization?.name} />
        </div>

        <div className="grid gap-2">
          <Label>Plan actuel</Label>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{organization?.plan || "Free"}</Badge>
            <Button variant="link" className="h-auto p-0 text-sm">
              Mettre à niveau
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-2">
          <Label className="text-destructive">Zone de danger</Label>
          <p className="text-sm text-muted-foreground">
            Les actions ci-dessous sont irréversibles.
          </p>
          <Button variant="destructive" className="w-fit">
            Supprimer l&apos;organisation
          </Button>
        </div>
      </div>
    </div>
  )
}

export function OrganizationsDialog({
  open,
  onOpenChange,
  organizations,
  activeOrganizationId,
  onOrganizationSelect,
  onCreateOrganization,
  currentUserRole,
  members,
  pendingInvitations,
  onInviteMember,
  onRemoveMember,
  onCancelInvitation,
  loadingMembers = false,
}: OrganizationsDialogProps) {
  const [activeSection, setActiveSection] = React.useState("organisations")

  const activeOrganization = organizations.find((o) => o.id === activeOrganizationId)
  const activeItem = navItems.find((item) => item.id === activeSection)

  const renderContent = () => {
    if (loadingMembers) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )
    }

    switch (activeSection) {
      case "organisations":
        return (
          <OrganisationsSection
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
            onOrganizationSelect={onOrganizationSelect}
            onCreateOrganization={onCreateOrganization}
          />
        )
      case "membres":
        return (
          <MembresSection
            members={members}
            currentUserRole={currentUserRole}
            onRemoveMember={onRemoveMember}
          />
        )
      case "invitations":
        return (
          <InvitationsSection
            pendingInvitations={pendingInvitations}
            currentUserRole={currentUserRole}
            onInviteMember={onInviteMember}
            onCancelInvitation={onCancelInvitation}
          />
        )
      case "parametres":
        return <ParametresSection organization={activeOrganization} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Mes organisations</DialogTitle>
        <DialogDescription className="sr-only">
          Gérez vos organisations et leurs membres.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex bg-background text-foreground">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={item.id === activeSection}
                          onClick={() => setActiveSection(item.id)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#" onClick={(e) => e.preventDefault()}>
                      Organisations
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeItem?.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {renderContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
