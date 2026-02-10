"use client"

import * as React from "react"
import { Send, Bot, User, Sparkles, X, Minimize2, RefreshCw, Info } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAiAssistantStore } from "@/stores/ai-assistant-store"
import { useAiHealthContext } from "@/contexts/ai-health-context"
import { useAuth } from "@/hooks/auth"
import remarkGfm from "remark-gfm"

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showDebug, setShowDebug] = React.useState(false)
  const { isOnline, isChecking } = useAiHealthContext()
  const { token } = useAuth()

  const messages = useAiAssistantStore((state) => state.messages)
  const isLoading = useAiAssistantStore((state) => state.isLoading)
  const sessionId = useAiAssistantStore((state) => state.sessionId)
  const sendMessage = useAiAssistantStore((state) => state.sendMessageStream)
  const createNewSession = useAiAssistantStore((state) => state.createNewSession)
  const setToken = useAiAssistantStore((state) => state.setToken)

  // Connecter le token au store au montage
  React.useEffect(() => {
    setToken(token || null)
  }, [token, setToken])

  React.useEffect(() => {
    const openAssistant = () => setIsOpen(true)
    window.addEventListener("ai-assistant:open", openAssistant)
    return () => window.removeEventListener("ai-assistant:open", openAssistant)
  }, [])

  const [input, setInput] = React.useState("")
  const [sessionStartTime, setSessionStartTime] = React.useState(new Date())
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Réinitialiser le timer quand la session change
  React.useEffect(() => {
    setSessionStartTime(new Date())
  }, [sessionId])

  // Forcer le re-render toutes les secondes pour mettre à jour la durée
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)
  React.useEffect(() => {
    if (showDebug) {
      const interval = setInterval(forceUpdate, 1000)
      return () => clearInterval(interval)
    }
  }, [showDebug])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const messageToSend = input
    setInput("")
    await sendMessage(messageToSend)
  }

  const handleNewSession = () => {
    createNewSession()
    setInput("")
  }

  // Calculer les stats de session
  const userMessages = messages.filter((m) => m.role === "user")
  const sessionDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <>
      {/* Widget de chat flottant */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-24 right-6 z-50",
          "w-[400px] h-[600px]",
          "bg-white dark:bg-gray-900 rounded-2xl shadow-2xl",
          "border border-gray-200 dark:border-gray-800",
          "flex flex-col overflow-hidden",
          "animate-in fade-in-0 slide-in-from-bottom-5 duration-300"
        )}>
          {/* Header */}
          <div className="border-b bg-gradient-to-br from-blue-500/8 via-cyan-500/8 to-teal-500/8 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 border border-blue-500/20">
                  <Bot className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, oklch(0.60 0.24 250) 0%, oklch(0.65 0.29 280) 50%, oklch(0.70 0.25 310) 100%)'
                    }}>
                    Assistant IA
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {isChecking ? (
                      <>
                        <span className="inline-block size-1.5 rounded-full bg-gray-400" />
                        Vérification...
                      </>
                    ) : isOnline ? (
                      <>
                        <span className="inline-block size-1.5 animate-pulse rounded-full bg-green-500" />
                        En ligne
                      </>
                    ) : (
                      <>
                        <span className="inline-block size-1.5 rounded-full bg-red-500" />
                        Hors ligne
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDebug(!showDebug)}
                  className="size-8"
                  title="Debug"
                >
                  <Info className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewSession}
                  disabled={isLoading}
                  className="size-8"
                  title="Nouvelle conversation"
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Debug Panel */}
            {showDebug && (
              <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Session:</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {sessionId.slice(0, 8)}...
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Messages:</span>
                  <Badge variant="outline" className="text-[10px]">{userMessages.length}/{messages.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Durée:</span>
                  <Badge variant="outline" className="text-[10px]">{formatDuration(sessionDuration)}</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 animate-in fade-in-0 slide-in-from-bottom-2",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  <Avatar className={cn(
                    "size-8 shrink-0",
                    message.role === "assistant" && "bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 border border-blue-500/20"
                  )}>
                    <AvatarFallback className={cn(
                      message.role === "assistant" ? "text-blue-600 dark:text-blue-400 bg-transparent" : "bg-muted"
                    )}>
                      {message.role === "assistant" ? (
                        <Bot className="size-4" />
                      ) : (
                        <User className="size-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    "flex flex-col gap-1 max-w-[75%]",
                    message.role === "user" && "items-end"
                  )}>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm",
                        message.role === "assistant"
                          ? "bg-muted text-foreground"
                          : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                      )}
                    >
                      <div className={cn(
                        message.role === "assistant"
                          ? "prose-sm prose-p:my-1 prose-headings:my-2"
                          : ""
                      )}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {message.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3 bg-muted/30">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="flex-1 h-10"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="size-10 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full shadow-2xl",
          "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500",
          "transition-all duration-300",
          "active:scale-95",
          "overflow-hidden border-2 border-white/20"
        )}
        title={isOpen ? "Fermer le chat" : "Ouvrir l'Assistant IA"}
      >
        {isOpen ? (
          <X className="size-6 text-white" strokeWidth={2} />
        ) : (
          <Sparkles className="size-6 text-white" strokeWidth={2} />
        )}

      </Button>
    </>
  )
}
