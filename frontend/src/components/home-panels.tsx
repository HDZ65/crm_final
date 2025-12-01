"use client"

import * as React from "react"
import Tickets from "@/components/tickets"


export function HomePanels() {
  const quickSearchRef = React.useRef<HTMLDivElement | null>(null)
  const [topRowHeight, setTopRowHeight] = React.useState<number>()

  React.useEffect(() => {
    const node = quickSearchRef.current
    if (!node || typeof ResizeObserver === "undefined") return

    setTopRowHeight(Math.round(node.getBoundingClientRect().height))

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setTopRowHeight(Math.round(entry.contentRect.height))
      }
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="grid h-full w-full gap-2 md:grid-cols-2">
      <div className="flex min-h-0 flex-col gap-2">
        <div
          className="h-fit overflow-hidden"
          style={topRowHeight ? { height: topRowHeight } : undefined}
        >
          <div className="h-full min-h-0">
            <Tickets />
          </div>
        </div>
      </div>
    </div>
  )
}
