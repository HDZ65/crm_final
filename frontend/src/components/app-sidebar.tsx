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
  Package,
  ListTodo,
  Receipt,
  Calendar,
  Settings,
  Rocket,
  FlaskConical,
  FileText,
  CreditCard,
  Bug,
  Shield,
  ShieldCheck,
  Palette,
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
import { useAuth, useCreateInvitation, useOrganisationInvitations, useCancelInvitation, useOrganisationMembers, useDeleteOrganisation, useUpdateOrganisation, useLeaveOrganisation, useRemoveMember, useUpdateMemberRole, useAvailableRoles } from "@/hooks/auth";
import { useOrganisation } from "@/contexts/organisation-context";
import { TeamSwitcher } from "./team-switcher";
import { OrganizationsDialog } from "./organizations-dialog";
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
    title: "Commerciaux",
    url: "/commerciaux",
    icon: Briefcase,
  },
  {
    title: "Catalogue",
    url: "/catalogue",
    icon: Package,
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
    title: "Validation ADV",
    url: "/commissions/validation",
    icon: ShieldCheck,
  },
  {
    title: "Reporting",
    url: "/commissions/reporting",
    icon: BarChart3,
  },
  {
    title: "Facturation",
    url: "/facturation",
    icon: Receipt,
  },
  {
    title: "Tâches",
    url: "/taches",
    icon: ListTodo,
  },
  {
    title: "Calendrier",
    url: "/calendrier",
    icon: Calendar,
  },
  {
    title: "Statistiques",
    url: "/statistiques",
    icon: BarChart3,
  },
];

const NAV_SECONDARY_ITEMS = [
  {
    title: "Paramètres",
    url: "/parametres/types-activites",
    icon: Settings,
  },
  {
    title: "Permissions",
    url: "/parametres/permissions",
    icon: Shield,
  },
  {
    title: "Rôles & Permissions",
    url: "/parametres/roles-permissions",
    icon: ShieldCheck,
  },
  {
    title: "Marque Blanche",
    url: "/parametres/marque-blanche",
    icon: Palette,
  },
  {
    title: "Onboarding",
    url: "/onboarding",
    icon: Rocket,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, ready, isAuthenticated, login, logout } = useAuth();
  const { utilisateur, organisations, activeOrganisation, setActiveOrganisation, refetch, isOwner } = useOrganisation();
  const [manageDialogOpen, setManageDialogOpen] = React.useState(false);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);
  // Organisation sélectionnée dans la modale (peut être différente de l'active)
  const [selectedOrgIdInDialog, setSelectedOrgIdInDialog] = React.useState<string | null>(null);

  // Hooks pour les invitations, membres et rôle
  const { createInvitation } = useCreateInvitation();
  const { invitations, fetchInvitations } = useOrganisationInvitations();
  const { cancelInvitation } = useCancelInvitation();
  const { members: apiMembers, fetchMembers } = useOrganisationMembers();
  // useMyRole n'est plus nécessaire - on utilise isOwner du contexte
  const { deleteOrganisation } = useDeleteOrganisation({
    onSuccess: async () => {
      await refetch();
      setManageDialogOpen(false);
    },
  });
  const { updateOrganisation } = useUpdateOrganisation({
    onSuccess: async () => {
      await refetch();
    },
  });
  const { leaveOrganisation } = useLeaveOrganisation({
    onSuccess: async () => {
      await refetch();
      setManageDialogOpen(false);
    },
  });
  const { removeMember } = useRemoveMember({
    onSuccess: async () => {
      if (dialogOrgId) {
        await fetchMembers(dialogOrgId);
      }
    },
  });
  const { updateMemberRole } = useUpdateMemberRole({
    onSuccess: async () => {
      if (dialogOrgId) {
        await fetchMembers(dialogOrgId);
      }
    },
  });
  const { roles: availableRoles, fetchRoles } = useAvailableRoles();

  // ID de l'organisation à afficher dans la modale
  const dialogOrgId = selectedOrgIdInDialog || activeOrganisation?.organisationId;

  // Charger les rôles disponibles quand le dialog s'ouvre
  React.useEffect(() => {
    if (dialogOrgId && manageDialogOpen) {
      fetchRoles();
    }
  }, [dialogOrgId, manageDialogOpen, fetchRoles]);

  // Initialiser l'organisation sélectionnée quand le dialog s'ouvre
  React.useEffect(() => {
    if (manageDialogOpen && activeOrganisation?.organisationId) {
      setSelectedOrgIdInDialog(activeOrganisation.organisationId);
    }
  }, [manageDialogOpen, activeOrganisation?.organisationId]);

  // Charger les invitations et membres quand le dialog s'ouvre ou l'org change
  React.useEffect(() => {
    if (manageDialogOpen && dialogOrgId) {
      // Réinitialiser les IDs supprimés localement avant de recharger
      setDeletedInvitationIds([]);
      fetchInvitations(dialogOrgId);
      fetchMembers(dialogOrgId);
    }
  }, [manageDialogOpen, dialogOrgId, fetchInvitations, fetchMembers]);

  // Données des équipes basées sur les organisations de l'utilisateur
  const teamsData = React.useMemo(() => {
    return organisations.map((org) => ({
      id: org.organisationId,
      name: org.organisationNom,
      logo: AudioWaveform,
      plan: org.etat === "actif" ? "Actif" : "Inactif",
    }));
  }, [organisations]);

  // Données de l'équipe active
  const activeTeamData = React.useMemo(() => {
    if (activeOrganisation) {
      return {
        id: activeOrganisation.organisationId,
        name: activeOrganisation.organisationNom,
        logo: AudioWaveform,
        plan: activeOrganisation.etat === "actif" ? "Actif" : "Inactif",
      };
    }
    return null;
  }, [activeOrganisation]);

  // Handler pour changer d'organisation
  const handleTeamChange = React.useCallback((team: { id: string; name: string; logo: React.ElementType; plan: string }) => {
    const org = organisations.find((o) => o.organisationId === team.id);
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

  // Récupérer le rôle de l'utilisateur actuel depuis le contexte
  const currentUserRole = React.useMemo(() => {
    // Utiliser isOwner du contexte au lieu de l'API REST
    return isOwner ? "owner" as const : "member" as const;
  }, [isOwner]);


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

        // Mapper le rôle depuis l'objet role.code (seulement owner et member)
        const roleCode = member.role?.code?.toLowerCase() || "member";
        const role = (roleCode === "owner" ? "owner" : "member") as "owner" | "member";

        return {
          id: member.id,
          userId: member.utilisateurId,
          email: member.utilisateur?.email || "",
          name: capitalizedName,
          role,
          roleId: member.role?.id,
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
        role: (inv.roleNom?.toLowerCase() === "owner" ? "owner" : "member") as "owner" | "member",
        invitedBy: profile?.fullName || profile?.email || "Vous",
        invitedAt: new Date(inv.expireAt),
      }));
  }, [invitations, profile, deletedInvitationIds]);

  // Handler pour le changement d'organisation dans la modale
  const handleOrganizationSelectInDialog = React.useCallback((orgId: string) => {
    setSelectedOrgIdInDialog(orgId);
  }, []);

  const handleInviteMember = async (email: string) => {
    if (!dialogOrgId) return;

    // Appel API pour créer l'invitation
    const invitation = await createInvitation(dialogOrgId, email);

    // Rafraîchir la liste des invitations
    if (invitation) {
      await fetchInvitations(dialogOrgId);
      // Retourner l'invitation pour afficher le lien
      return {
        id: invitation.id,
        inviteUrl: invitation.inviteUrl || `${window.location.origin}/invite`,
        email: invitation.email,
      };
    }
  };

  const handleUpdateMemberRole = async (memberId: string, roleId: string) => {
    await updateMemberRole(memberId, roleId);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!dialogOrgId) return;
    await removeMember(memberId);
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
            onManageOrganizations={() => setManageDialogOpen(true)}
            onCreateOrganization={() => setCreateOrgDialogOpen(true)}
          />
        </SidebarHeader>
      <SidebarContent>
        <NavMain items={NAV_ITEMS} />
        <NavMain items={NAV_SECONDARY_ITEMS} label="Utilitaires & Dev" />
      </SidebarContent>
      <SidebarFooter>
        {isAuthenticated && userData ? (
          <NavUser user={userData} onLogout={logout} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="gap-2 rounded-2xl border border-dashed border-border/70 text-sm font-semibold"
                onClick={() => login()}
              >
                <LogIn className="size-4" />
                Se connecter
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>

    {/* Dialog de gestion des organisations */}
    <OrganizationsDialog
      open={manageDialogOpen}
      onOpenChange={setManageDialogOpen}
      organizations={teamsData.map((t) => ({ id: t.id, name: t.name, plan: t.plan }))}
      activeOrganizationId={dialogOrgId || ""}
      onOrganizationSelect={handleOrganizationSelectInDialog}
      onCreateOrganization={() => {
        setManageDialogOpen(false);
        setCreateOrgDialogOpen(true);
      }}
      onDeleteOrganization={async (id) => { await deleteOrganisation(id); }}
      onUpdateOrganization={async (id, data) => { await updateOrganisation(id, data); }}
      onLeaveOrganization={async (orgId) => {
        if (!utilisateur?.id) return;
        await leaveOrganisation(orgId, utilisateur.id);
      }}
      currentUserRole={currentUserRole}
      members={members}
      pendingInvitations={pendingInvitations}
      availableRoles={availableRoles}
      onInviteMember={handleInviteMember}
      onUpdateMemberRole={handleUpdateMemberRole}
      onRemoveMember={handleRemoveMember}
      onCancelInvitation={handleCancelInvitation}
    />

    {/* Dialog de création d'organisation */}
    <CreateOrganizationDialog
      open={createOrgDialogOpen}
      onOpenChange={setCreateOrgDialogOpen}
      onSuccess={handleOrganizationCreated}
    />
  </>
  );
}
