"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  label,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {label && (
        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
           {items.map((item) => {
             const isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url + '/'))
             return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className="data-[active=true]:bg-sidebar-primary! data-[active=true]:text-sidebar-primary-foreground! "
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
