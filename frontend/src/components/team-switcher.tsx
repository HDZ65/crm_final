"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Settings, Check } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

interface Team {
    id: string
    name: string
    logo: React.ElementType
    plan: string
}

export function TeamSwitcher({
    teams,
    activeTeam,
    onTeamChange,
    onManageOrganizations,
    onCreateOrganization,
}: {
    teams: Team[]
    activeTeam: Team | null
    onTeamChange?: (team: Team) => void
    onManageOrganizations?: () => void
    onCreateOrganization?: () => void
}) {
    const { isMobile } = useSidebar()

    if (!activeTeam) {
        return null
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <activeTeam.logo className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{activeTeam.name}</span>
                                <span className="truncate text-xs">{activeTeam.plan}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Organisations
                        </DropdownMenuLabel>
                        {teams.map((team, index) => (
                            <DropdownMenuItem
                                key={team.id}
                                onClick={() => onTeamChange?.(team)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border">
                                    <team.logo className="size-3.5 shrink-0" />
                                </div>
                                <span className="flex-1">{team.name}</span>
                                {team.id === activeTeam.id && (
                                    <Check className="size-4 text-primary" />
                                )}
                                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        {onManageOrganizations && (
                            <DropdownMenuItem className="gap-2 p-2" onClick={onManageOrganizations}>
                                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                    <Settings className="size-4" />
                                </div>
                                <div className="font-medium">Gérer mes organisations</div>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="gap-2 p-2" onClick={onCreateOrganization}>
                            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                <Plus className="size-4" />
                            </div>
                            <div className="font-medium">Créer une organisation</div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
