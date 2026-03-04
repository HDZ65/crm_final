"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { useAiAssistantStore } from "@/stores/ai-assistant-store"

type AskAiCardButtonProps = {
  prompt: string
  title?: string
  className?: string
}

export function AskAiCardButton({
  prompt,
  title = "Analyser cette carte avec l'Assistant IA",
  className,
}: AskAiCardButtonProps) {
  const gradientId = React.useId()
  const isLoading = useAiAssistantStore((state) => state.isLoading)
  const sendMessageStream = useAiAssistantStore((state) => state.sendMessageStream)

  const handleClick = React.useCallback(async () => {
    if (!prompt.trim() || isLoading) return
    window.dispatchEvent(new Event("ai-assistant:open"))
    await sendMessageStream(prompt)
  }, [isLoading, prompt, sendMessageStream])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={
        className ??
        "size-8 text-muted-foreground hover:bg-muted/50"
      }
      onClick={handleClick}
      disabled={isLoading}
      title={title}
      aria-label={title}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <path
          d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M20 3v4" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
        <path d="M22 5h-4" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
        <path d="M4 17v2" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
        <path d="M5 18H3" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </Button>
  )
}
