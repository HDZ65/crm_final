import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { FloatingAiChat } from "@/components/floating-ai-chat";
import { OrganizationGuard } from "@/components/organization-guard";
import { OrganisationProvider } from "@/contexts/organisation-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { AiHealthProvider } from "@/contexts/ai-health-context";
import { getServerUserProfile, getActiveOrgIdFromCookie } from "@/lib/auth.server";
import { getServerNotifications } from "@/lib/server-data";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch user data and active org server-side
  const [userProfile, activeOrgId] = await Promise.all([
    getServerUserProfile(),
    getActiveOrgIdFromCookie(),
  ]);

  // Fetch notifications server-side if user is authenticated
  const notificationData = userProfile?.utilisateur?.id
    ? await getServerNotifications(userProfile.utilisateur.id)
    : null;

  return (
    <OrganisationProvider initialUser={userProfile} initialActiveOrgId={activeOrgId}>
      <NotificationProvider initialData={notificationData}>
        <OrganizationGuard>
          <AiHealthProvider>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 60)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset className="flex flex-col overflow-hidden">
              <SiteHeader />
              <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
                {children}
              </div>
            </SidebarInset>
            <FloatingAiChat />
          </SidebarProvider>
        </AiHealthProvider>
        </OrganizationGuard>
      </NotificationProvider>
    </OrganisationProvider>
  );
}
