"use client"

import * as React from "react"
import { Send, Bot, User, X, Info, RefreshCw, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAiAssistantStore } from "@/stores/ai-assistant-store"
import { useAiHealthContext } from "@/contexts/ai-health-context"
import { useAuth } from "@/hooks/auth"

export function AiAssistantFab() {
  const { token } = useAuth()
  const [open, setOpen] = React.useState(false)

  const messages = useAiAssistantStore((state) => state.messages)
  const isLoading = useAiAssistantStore((state) => state.isLoading)
  const sessionId = useAiAssistantStore((state) => state.sessionId)
  const sendMessage = useAiAssistantStore((state) => state.sendMessageStream)
  const createNewSession = useAiAssistantStore((state) => state.createNewSession)
  const setToken = useAiAssistantStore((state) => state.setToken)
  const { isOnline } = useAiHealthContext()

  // Connecter le token au store au montage
  React.useEffect(() => {
    setToken(token || null)
  }, [token, setToken])

  React.useEffect(() => {
    const openAssistant = () => setOpen(true)
    window.addEventListener("ai-assistant:open", openAssistant)
    return () => window.removeEventListener("ai-assistant:open", openAssistant)
  }, [])

  const [input, setInput] = React.useState("")
  const [showDebug, setShowDebug] = React.useState(false)
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
    if (showDebug && open) {
      const interval = setInterval(forceUpdate, 1000)
      return () => clearInterval(interval)
    }
  }, [showDebug, open])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const messageToSend = input
    setInput("") // Clear input immediately
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
    <Sheet open={open} onOpenChange={setOpen}>
      {/* FAB Button */}
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 p-0"
          aria-label="Ouvrir l'assistant IA"
        >
          <Sparkles className="size-6" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {messages.filter(m => m.role === "assistant").length}
            </span>
          )}
        </Button>
      </SheetTrigger>

      {/* Sheet Content */}
      <SheetContent className="w-full p-0 flex flex-col h-[80vh] max-h-[860px] sm:max-w-lg overflow-hidden">
        <SheetHeader className="border-b shrink-0 bg-gradient-to-br from-blue-500/8 via-cyan-500/8 to-teal-500/8 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 border border-blue-500/20">
                <Bot className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, oklch(0.60 0.24 250) 0%, oklch(0.65 0.29 280) 50%, oklch(0.70 0.25 310) 100%)'
                  }}>
                  Assistant IA
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-xs">
                  {isOnline ? (
                    <>
                      <span className="inline-block size-2 animate-pulse rounded-full bg-green-500" />
                      En ligne
                    </>
                  ) : (
                    <>
                      <span className="inline-block size-2 rounded-full bg-red-500" />
                      Hors ligne
                    </>
                  )}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDebug(!showDebug)}
                className="size-8"
                title="Afficher les infos de debug"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewSession}
                disabled={isLoading}
                className="size-8"
                title="Nouvelle conversation"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Session ID:</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {sessionId.slice(0, 8)}...{sessionId.slice(-4)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages:</span>
                <Badge variant="outline" className="text-[10px]">{userMessages.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Durée:</span>
                <Badge variant="outline" className="text-[10px]">{formatDuration(sessionDuration)}</Badge>
              </div>
              <div className="pt-1 border-t border-border">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sessionId)
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Copier session ID
                </button>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-hidden bg-white">
          <ScrollArea className="h-full w-full">
            <div className="space-y-4 p-4 pb-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-16 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
                    <Bot className="size-8 text-blue-500" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Bienvenue !</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Je suis votre assistant CRM. Posez-moi une question sur vos clients, contrats ou statistiques.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2",
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
                      "flex flex-col gap-2 max-w-[85%]",
                      message.role === "user" && "items-end"
                    )}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm",
                          message.role === "assistant"
                            ? "bg-muted text-foreground"
                            : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                        )}
                      >
                        <div
                          className={cn(
                            message.role === "assistant"
                              ? "prose-sm [&>hr]:my-4"
                              : ""
                          )}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <span className="text-xs text-muted-foreground px-1">
                        {message.timestamp.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <SheetFooter className="border-t shrink-0 p-4">
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                className="pr-10"
                disabled={isLoading}
              />
              {input && (
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                  disabled={isLoading}
                >
                  <Send className="size-4" />
                </Button>
              )}
            </div>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
