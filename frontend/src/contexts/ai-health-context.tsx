"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"

const NEXT_API_HEALTH_URL = "/api/ai/health"
const DIRECT_BACKEND_HEALTH_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL.replace(/\/$/, "")}/ai/health`
  : null

type HealthStatus = {
  online: boolean
  status?: string
}

interface AiHealthContextType {
  isOnline: boolean
  isChecking: boolean
}

const AiHealthContext = createContext<AiHealthContextType | undefined>(undefined)

const parseResponse = async (response: Response): Promise<HealthStatus> => {
  if (!response.ok) {
    return { online: false }
  }

  try {
    const data = await response.json()
    return {
      online: data?.online === true,
      status: data?.status,
    }
  } catch (error) {
    console.error("Failed to parse AI health response:", error)
    return { online: false }
  }
}

interface AiHealthProviderProps {
  children: ReactNode
  intervalMs?: number
}

export function AiHealthProvider({ children, intervalMs = 30000 }: AiHealthProviderProps) {
  const [isOnline, setIsOnline] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Éviter le double appel en StrictMode
    if (hasInitialized.current) return
    hasInitialized.current = true

    let isMounted = true

    const checkHealth = async () => {
      try {
        // 1) Try the Next.js proxy route first
        let response: Response | null = null
        try {
          response = await fetch(NEXT_API_HEALTH_URL, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          })
        } catch (error) {
          console.warn("AI health proxy fetch failed, attempting direct call...", error)
        }

        // 2) Fallback to direct backend call if proxy fails (404 or network)
        if (
          (!response || response.status === 404 || response.status === 500) &&
          DIRECT_BACKEND_HEALTH_URL
        ) {
          try {
            response = await fetch(DIRECT_BACKEND_HEALTH_URL, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              cache: "no-store",
            })
          } catch (error) {
            console.error("Direct backend AI health fetch failed:", error)
            response = null
          }
        }

        if (!isMounted) return

        if (response) {
          const result = await parseResponse(response)
          setIsOnline(result.online)
        } else {
          setIsOnline(false)
        }
      } catch (error) {
        console.error("AI health check error:", error)
        if (isMounted) {
          setIsOnline(false)
        }
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    // Vérification initiale
    checkHealth()

    // Vérification périodique
    const interval = setInterval(checkHealth, intervalMs)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [intervalMs])

  return (
    <AiHealthContext.Provider value={{ isOnline, isChecking }}>
      {children}
    </AiHealthContext.Provider>
  )
}

export function useAiHealthContext() {
  const context = useContext(AiHealthContext)
  if (context === undefined) {
    throw new Error("useAiHealthContext must be used within an AiHealthProvider")
  }
  return context
}
