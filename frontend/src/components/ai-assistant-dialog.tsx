"use client"

import * as React from "react"
import { Send, Bot, User, Loader2, Plus, Info, RefreshCw } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAiAssistantStore } from "@/stores/ai-assistant-store"
import { useAuth } from "@/hooks/auth"
import remarkGfm from "remark-gfm"

type AiAssistantDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiAssistantDialog({ open, onOpenChange }: AiAssistantDialogProps) {
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
    if (open) {
      // Focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <div className="flex max-h-[90vh] flex-col">
          <div className="border-b bg-gradient-to-br from-blue-500/8 via-cyan-500/8 to-teal-500/8 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 border border-blue-500/20">
                  <Bot className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, oklch(0.60 0.24 250) 0%, oklch(0.65 0.29 280) 50%, oklch(0.70 0.25 310) 100%)'
                    }}>
                    Assistant IA
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="inline-block size-2 animate-pulse rounded-full bg-green-500" />
                    En ligne
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDebug(!showDebug)}
                  className="size-9"
                  title="Afficher les infos de debug"
                >
                  <Info className="size-4" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNewSession}
                  disabled={isLoading}
                  className="gap-2 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                >
                  <RefreshCw className="size-4" />
                  Nouvelle conversation
                </Button>
              </div>
            </div>

            {/* Debug Panel */}
            {showDebug && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Session ID:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {sessionId.slice(0, 8)}...{sessionId.slice(-4)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Messages utilisateur:</span>
                  <Badge variant="outline">{userMessages.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Messages totaux:</span>
                  <Badge variant="outline">{messages.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Durée session:</span>
                  <Badge variant="outline">{formatDuration(sessionDuration)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={isLoading ? "default" : "secondary"}>
                    {isLoading ? "En cours..." : "Prêt"}
                  </Badge>
                </div>
                <div className="pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sessionId)
                      alert("Session ID copié !")
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    📋 Copier le session ID complet
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 p-6 min-h-0">
            <ScrollArea className="h-[calc(90vh-240px)]">
              <div className="space-y-4 pr-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <Avatar className={cn(
                      "size-10 shrink-0",
                      message.role === "assistant" && "bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 border border-blue-500/20"
                    )}>
                      <AvatarFallback className={cn(
                        message.role === "assistant" ? "text-blue-600 dark:text-blue-400 bg-transparent" : "bg-muted"
                      )}>
                        {message.role === "assistant" ? (
                          <Bot className="size-5" />
                        ) : (
                          <User className="size-5" />
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
                        <ReactMarkdown
                          className={cn(
                            message.role === "assistant"
                              ? "prose-sm [&>hr]:my-4"
                              : ""
                          )}
                          remarkPlugins={[remarkGfm]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      <span className="text-xs text-muted-foreground px-1">
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
          </div>

          <div className="border-t p-6 bg-muted/30">
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
                  placeholder="Posez votre question sur le CRM..."
                  className="pr-12 h-12"
                  disabled={isLoading}
                />
                {input && (
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 size-10 -translate-y-1/2 hover:bg-blue-500 hover:text-white"
                    disabled={isLoading}
                  >
                    <Send className="size-5" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
