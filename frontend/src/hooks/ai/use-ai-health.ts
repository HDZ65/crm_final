import { useState, useEffect } from "react"

const NEXT_API_HEALTH_URL = "/api/ai/health"
const DIRECT_BACKEND_HEALTH_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL.replace(/\/$/, "")}/ai/health`
  : null

type HealthStatus = {
  online: boolean
  status?: string
}

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

export function useAiHealth(intervalMs: number = 30000) {
  const [isOnline, setIsOnline] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
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

  return { isOnline, isChecking }
}
