"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { NAV_GROUPS, DASHBOARD_ITEM } from "@/lib/nav-config"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  
  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une page..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect(DASHBOARD_ITEM.url)}>
            {DASHBOARD_ITEM.icon && <DASHBOARD_ITEM.icon className="mr-2 h-4 w-4" />}
            <span>{DASHBOARD_ITEM.title}</span>
          </CommandItem>
        </CommandGroup>
        
        {NAV_GROUPS.map((group) => (
          <CommandGroup key={group.id} heading={group.label}>
            {group.items.map((item) => (
              <>
                <CommandItem key={item.url} onSelect={() => handleSelect(item.url)}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </CommandItem>
                {item.children?.map((child) => (
                  <CommandItem key={child.url} onSelect={() => handleSelect(child.url)}>
                    {child.icon && <child.icon className="mr-2 h-4 w-4 ml-4" />}
                    <span className="ml-4">{child.title}</span>
                  </CommandItem>
                ))}
              </>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
