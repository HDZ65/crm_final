"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, Server, ServerOff } from "lucide-react"
import { useAppStore } from "@/stores/app-store"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface ConnectionStatusProps {
  className?: string
  showWhenConnected?: boolean
  checkInterval?: number
}

// ============================================
// Component
// ============================================

export function ConnectionStatus({
  className,
  showWhenConnected = false,
  checkInterval = 30000, // 30 secondes
}: ConnectionStatusProps) {
  const isOnline = useAppStore((state) => state.isOnline)
  const isServerReachable = useAppStore((state) => state.isServerReachable)
  const setOnline = useAppStore((state) => state.setOnline)
  const setServerReachable = useAppStore((state) => state.setServerReachable)
  
  const [isChecking, setIsChecking] = useState(false)

  // Ecouter les changements de connexion navigateur
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    
    // Set initial state
    setOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [setOnline])

  // Verifier periodiquement la connectivite serveur
  useEffect(() => {
    const checkServerConnection = async () => {
      if (!isOnline) {
        setServerReachable(false)
        return
      }
      
      setIsChecking(true)
      try {
        // Ping un endpoint leger (health check)
        const response = await fetch("/api/health", {
          method: "HEAD",
          cache: "no-store",
        })
        setServerReachable(response.ok)
      } catch {
        setServerReachable(false)
      } finally {
        setIsChecking(false)
      }
    }
    
    // Check initial
    checkServerConnection()
    
    // Check periodique
    const interval = setInterval(checkServerConnection, checkInterval)
    
    return () => clearInterval(interval)
  }, [isOnline, checkInterval, setServerReachable])

  // Ne rien afficher si tout va bien et showWhenConnected est false
  if (isOnline && isServerReachable && !showWhenConnected) {
    return null
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: "Hors ligne",
        description: "Verifiez votre connexion internet",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
      }
    }
    
    if (!isServerReachable) {
      return {
        icon: ServerOff,
        text: "Serveur inaccessible",
        description: "Le serveur ne repond pas",
        color: "text-yellow-600",
        bgColor: "bg-yellow-500/10",
      }
    }
    
    return {
      icon: isServerReachable ? Server : Wifi,
      text: "Connecte",
      description: "Tout fonctionne normalement",
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    }
  }

  const status = getStatusInfo()
  const Icon = status.icon

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all",
        status.bgColor,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn(
          "h-4 w-4",
          status.color,
          isChecking && "animate-pulse"
        )}
      />
      <div className="text-sm">
        <span className={cn("font-medium", status.color)}>{status.text}</span>
        {!isOnline || !isServerReachable ? (
          <span className="ml-2 text-muted-foreground text-xs">
            {status.description}
          </span>
        ) : null}
      </div>
    </div>
  )
}

// ============================================
// Compact version for header/footer
// ============================================

interface ConnectionIndicatorProps {
  className?: string
}

export function ConnectionIndicator({ className }: ConnectionIndicatorProps) {
  const isOnline = useAppStore((state) => state.isOnline)
  const isServerReachable = useAppStore((state) => state.isServerReachable)
  
  const isConnected = isOnline && isServerReachable
  
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        className
      )}
      title={isConnected ? "Connecte" : isOnline ? "Serveur inaccessible" : "Hors ligne"}
    >
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          isConnected ? "bg-green-500" : isOnline ? "bg-yellow-500" : "bg-red-500"
        )}
      />
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {isConnected ? "En ligne" : isOnline ? "Serveur HS" : "Hors ligne"}
      </span>
    </div>
  )
}
