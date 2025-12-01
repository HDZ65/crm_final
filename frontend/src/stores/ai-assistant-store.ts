import { create } from "zustand"

// Génère un UUID v4 en utilisant l'API native crypto
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback pour les environnements sans crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AiAssistantStore {
  messages: Message[]
  isLoading: boolean
  sessionId: string
  token: string | null
  setToken: (token: string | null) => void
  sendMessageStream: (content: string) => Promise<void>
  clearMessages: () => void
  createNewSession: () => void
}

const initialMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour ! 👋 Comment puis-je vous aidez aujourd’hui ?",
  timestamp: new Date(),
}

export const useAiAssistantStore = create<AiAssistantStore>((set, get) => ({
  messages: [initialMessage],
  isLoading: false,
  sessionId: generateUUID(), // Génère un ID de session unique au démarrage
  token: null,

  setToken: (token: string | null) => {
    set({ token })
  },

  // 🔴 Streaming avec fetch (supporte les headers d'authentification)
  sendMessageStream: async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || get().isLoading) return

    const { token } = get()

    // 1️⃣ Ajoute le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }

    // 2️⃣ Ajoute un message assistant vide qu'on va remplir
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isLoading: true,
    }))

    // 3️⃣ Vérifier l'authentification
    if (!token) {
      console.warn('No authentication token, sending request without authentication')
      // Continuer sans authentification - utile pour le développement
    }

    // 4️⃣ Préparer la requête avec authentification
    const sessionId = get().sessionId
    const url = `${API_URL}/ai/generate?q=${encodeURIComponent(trimmed)}&session_id=${sessionId}`

    // Debug: Log session info to console
    console.log(`🔵 [Session] Sending message to session: ${sessionId}`)
    console.log(`📤 [Request] ${url}`)
    console.log(`🔐 [Auth] Token present: ${!!token}`)

    try {
      const headers: HeadersInit = {
        'Accept': 'text/event-stream',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // 5️⃣ Lire le stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.substring(6) // Remove 'data: ' prefix
              const data = JSON.parse(jsonData) as { token: string; is_final: boolean }

              // 6️⃣ Concatène les tokens reçus
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: m.content + data.token }
                    : m
                ),
              }))

              if (data.is_final) {
                set({ isLoading: false })
                console.log(`✅ [Session] Message completed for session: ${sessionId}`)
              }
            } catch (err) {
              console.error("Erreur parsing SSE:", err)
            }
          }
        }
      }
    } catch (err) {
      console.error("Erreur stream:", err)
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content:
                  m.content +
                  "\n❌ Erreur de stream. Vérifie que le serveur NestJS est démarré.",
              }
            : m
        ),
        isLoading: false,
      }))
    }
  },

  clearMessages: () =>
    set({
      messages: [initialMessage],
      isLoading: false,
    }),

  createNewSession: () => {
    const newSessionId = generateUUID()
    console.log(`🆕 [Session] Creating new session: ${newSessionId}`)
    set({
      messages: [initialMessage],
      isLoading: false,
      sessionId: newSessionId,
    })
  },
}))
