"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { HeaderSocieteSelector } from "@/components/header/header-societe-selector";
import { HeaderTasksDropdown } from "@/components/header/header-tasks-dropdown";
import { HeaderNotificationsDropdown } from "@/components/header/header-notifications-dropdown";
import { HeaderQuickActions } from "@/components/header/header-quick-actions";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
         <SidebarTrigger className="-ml-1" />
         <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
         <HeaderSocieteSelector />
        <div className="ml-auto flex items-center gap-2">
          <HeaderTasksDropdown />
          <HeaderNotificationsDropdown />
          <HeaderQuickActions />
        </div>
      </div>
    </header>
  );
}
