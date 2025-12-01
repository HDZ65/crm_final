"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Truck,
  DollarSign,
  BarChart3,
  LogIn,
  AudioWaveform,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth, useCreateInvitation, useOrganisationInvitations, useCancelInvitation, useOrganisationMembers, useMyRole } from "@/hooks/auth";
import { useOrganisation } from "@/contexts/organisation-context";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamSwitcher } from "./team-switcher";
import { OrganizationMembersDialog } from "./organization-members-dialog";
import { CreateOrganizationDialog } from "./create-organization-dialog";

const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Partenaires",
    url: "/partenaires",
    icon: Briefcase,
  },
  {
    title: "Expéditions",
    url: "/expeditions",
    icon: Truck,
  },
  {
    title: "Commissions",
    url: "/commissions",
    icon: DollarSign,
  },
  {
    title: "Statistiques",
    url: "/statistiques",
    icon: BarChart3,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, ready, isAuthenticated, login, logout } = useAuth();
  const { organisations, activeOrganisation, setActiveOrganisation, refetch } = useOrganisation();
  const [membersDialogOpen, setMembersDialogOpen] = React.useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);

  // Hooks pour les invitations, membres et rôle
  const { createInvitation } = useCreateInvitation();
  const { invitations, fetchInvitations } = useOrganisationInvitations();
  const { cancelInvitation } = useCancelInvitation();
  const { members: apiMembers, fetchMembers } = useOrganisationMembers();
  const { roleCode, fetchMyRole } = useMyRole();

  // Charger le rôle de l'utilisateur quand l'organisation change
  const organisationId = activeOrganisation?.id;
  React.useEffect(() => {
    if (organisationId) {
      fetchMyRole(organisationId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId]);

  // Charger les invitations et membres quand le dialog s'ouvre
  React.useEffect(() => {
    if (membersDialogOpen && organisationId) {
      // Réinitialiser les IDs supprimés localement avant de recharger
      setDeletedInvitationIds([]);
      fetchInvitations(organisationId);
      fetchMembers(organisationId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersDialogOpen, organisationId]);

  // Données des équipes basées sur les organisations de l'utilisateur
  const teamsData = React.useMemo(() => {
    return organisations.map((org) => ({
      id: org.id,
      name: org.nom,
      logo: AudioWaveform,
      plan: org.etat === "actif" ? "Actif" : "Inactif",
    }));
  }, [organisations]);

  // Données de l'équipe active
  const activeTeamData = React.useMemo(() => {
    if (activeOrganisation) {
      return {
        id: activeOrganisation.id,
        name: activeOrganisation.nom,
        logo: AudioWaveform,
        plan: activeOrganisation.etat === "actif" ? "Actif" : "Inactif",
      };
    }
    return null;
  }, [activeOrganisation]);

  // Handler pour changer d'organisation
  const handleTeamChange = React.useCallback((team: { id: string; name: string; logo: React.ElementType; plan: string }) => {
    const org = organisations.find((o) => o.id === team.id);
    if (org) {
      setActiveOrganisation(org);
    }
  }, [organisations, setActiveOrganisation]);

  // Handler pour la création d'organisation
  const handleOrganizationCreated = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  const userData = React.useMemo(() => {
    if (!profile) return null;
    const fullName =
      profile.fullName ||
      [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.username ||
      profile.email;

    return {
      name: fullName || undefined,
      email: profile.email || undefined,
      avatar: undefined,
    };
  }, [profile]);

  // Récupérer le rôle de l'utilisateur actuel depuis l'API
  const currentUserRole = React.useMemo(() => {
    if (!roleCode) return "member" as const;
    // Mapper le code du rôle vers le type attendu
    const validRoles = ["owner", "admin", "manager", "member", "viewer"] as const;
    if (validRoles.includes(roleCode as typeof validRoles[number])) {
      return roleCode as "owner" | "admin" | "member" | "viewer";
    }
    return "member" as const;
  }, [roleCode]);

  // Seul le owner peut inviter des membres
  const canManageMembers = currentUserRole === "owner";

  // Transformer les membres API en format attendu par le dialog
  const members = React.useMemo(() => {
    return apiMembers
      .filter((member) => member.etat === "actif")
      .map((member) => {
        // Construire le nom depuis l'objet utilisateur
        const prenom = member.utilisateur?.prenom || "";
        const nom = member.utilisateur?.nom || "";
        const name = `${prenom} ${nom}`.trim() || member.utilisateur?.email || "Utilisateur";

        // Capitaliser le nom
        const capitalizedName = name
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");

        // Mapper le rôle depuis l'objet role ou le roleId
        const roleNom = member.role?.nom?.toLowerCase() || "member";
        const role = (["owner", "admin", "member", "viewer"].includes(roleNom)
          ? roleNom
          : "member") as "owner" | "admin" | "member" | "viewer";

        return {
          id: member.id,
          userId: member.utilisateurId,
          email: member.utilisateur?.email || "",
          name: capitalizedName,
          role,
          joinedAt: new Date(member.dateActivation || member.createdAt),
        };
      });
  }, [apiMembers]);

  // État local pour les invitations supprimées (évite le re-fetch qui cause des re-renders)
  const [deletedInvitationIds, setDeletedInvitationIds] = React.useState<string[]>([]);

  // Transformer les invitations API en format attendu par le dialog
  // Filtrer les invitations annulées, acceptées et celles supprimées localement
  // Ne garder que les invitations en attente (pending)
  const pendingInvitations = React.useMemo(() => {
    return invitations
      .filter((inv) => inv.etat === 'pending' && !deletedInvitationIds.includes(inv.id))
      .map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: (inv.roleNom?.toLowerCase() || "member") as "owner" | "admin" | "member" | "viewer",
        invitedBy: profile?.fullName || profile?.email || "Vous",
        invitedAt: new Date(inv.expireAt),
      }));
  }, [invitations, profile, deletedInvitationIds]);

  const handleInviteMember = async (email: string, role: string) => {
    if (!activeOrganisation?.id) return;

    // Appel API pour créer l'invitation
    const invitation = await createInvitation(activeOrganisation.id, email);

    // Rafraîchir la liste des invitations
    if (invitation) {
      await fetchInvitations(activeOrganisation.id);
      // Retourner l'invitation pour afficher le lien
      return {
        id: invitation.id,
        inviteUrl: invitation.inviteUrl,
        email: invitation.email,
      };
    }
  };

  const handleUpdateMemberRole = async (_memberId: string, _role: string) => {
    // TODO: Implémenter quand l'API sera disponible
    // await api.patch(`/organisations/${activeOrganisation?.id}/membres/${memberId}`, { roleId });
    // Puis rafraîchir: fetchMembers(activeOrganisation.id);
  };

  const handleRemoveMember = async (_memberId: string) => {
    // TODO: Implémenter quand l'API sera disponible
    // await api.delete(`/organisations/${activeOrganisation?.id}/membres/${memberId}`);
    // Puis rafraîchir: fetchMembers(activeOrganisation.id);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await cancelInvitation(invitationId);
    // Marquer l'invitation comme supprimée localement (pas de re-fetch)
    setDeletedInvitationIds((prev) => [...prev, invitationId]);
  };

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <TeamSwitcher
            teams={teamsData}
            activeTeam={activeTeamData}
            onTeamChange={handleTeamChange}
            onManageMembers={canManageMembers ? () => setMembersDialogOpen(true) : undefined}
            onCreateOrganization={() => setCreateOrgDialogOpen(true)}
          />
        </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_ITEMS} />
      </SidebarContent>
      <SidebarFooter>
        {!ready ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <Skeleton className="h-14 w-full rounded-2xl" />
            </SidebarMenuItem>
          </SidebarMenu>
        ) : isAuthenticated && userData ? (
          <NavUser user={userData} onLogout={logout} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="gap-2 rounded-2xl border border-dashed border-border/70 text-sm font-semibold"
                onClick={login}
              >
                <LogIn className="size-4" />
                Se connecter
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>

    {/* Dialog de gestion des membres */}
    {canManageMembers && (
      <OrganizationMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        organizationId={activeOrganisation?.id || ""}
        organizationName={activeTeamData?.name || ""}
        currentUserRole={currentUserRole}
        members={members}
        pendingInvitations={pendingInvitations}
        onInviteMember={handleInviteMember}
        onUpdateMemberRole={handleUpdateMemberRole}
        onRemoveMember={handleRemoveMember}
        onCancelInvitation={handleCancelInvitation}
      />
    )}

    {/* Dialog de création d'organisation */}
    <CreateOrganizationDialog
      open={createOrgDialogOpen}
      onOpenChange={setCreateOrgDialogOpen}
      onSuccess={handleOrganizationCreated}
    />
  </>
  );
}
