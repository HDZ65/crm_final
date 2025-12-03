"use client"

import { useState, useCallback } from "react"
import type {
  OAuthProvider,
  OAuthConfig,
  ConnectedAccount,
} from "@/types/email"

// Re-export des types pour compatibilité avec les imports existants
export type {
  OAuthProvider,
  OAuthConfig,
  OAuthProviderConfig,
  ConnectedAccount,
} from "@/types/email"

// Configuration par défaut - À REMPLACER par vos vraies valeurs
const DEFAULT_CONFIG: OAuthConfig = {
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
    redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/google/callback`,
    scopes: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  },
  microsoft: {
    clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "YOUR_MICROSOFT_CLIENT_ID",
    redirectUri: process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/microsoft/callback`,
    scopes: [
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/User.Read",
    ],
  },
  microsoft365: {
    clientId: process.env.NEXT_PUBLIC_MICROSOFT365_CLIENT_ID || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "YOUR_MICROSOFT365_CLIENT_ID",
    redirectUri: process.env.NEXT_PUBLIC_MICROSOFT365_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/microsoft365/callback`,
    scopes: [
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/User.Read",
    ],
  },
}

/**
 * Buffer time in seconds before token actually expires to trigger refresh
 * Refresh 5 minutes before expiration
 */
const TOKEN_EXPIRY_BUFFER_SECONDS = 5 * 60

/**
 * Hook pour gérer l'authentification OAuth2 pour les emails
 */
export function useOAuthEmail(config: OAuthConfig = DEFAULT_CONFIG) {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Génère l'URL d'autorisation Google OAuth2
   */
  const getGoogleAuthUrl = useCallback(() => {
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.redirectUri,
      response_type: "code",
      scope: config.google.scopes.join(" "),
      access_type: "offline", // Pour obtenir un refresh token
      prompt: "consent", // Force l'affichage du consentement
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }, [config.google])

  /**
   * Génère l'URL d'autorisation Microsoft OAuth2
   */
  const getMicrosoftAuthUrl = useCallback(() => {
    const params = new URLSearchParams({
      client_id: config.microsoft.clientId,
      redirect_uri: config.microsoft.redirectUri,
      response_type: "code",
      scope: config.microsoft.scopes.join(" "),
      response_mode: "query",
    })

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }, [config.microsoft])

  /**
   * Ouvre une popup pour l'authentification OAuth
   */
  const openOAuthPopup = useCallback((url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const width = 500
      const height = 600
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const popup = window.open(
        url,
        "OAuth Login",
        `width=${width},height=${height},left=${left},top=${top}`
      )

      if (!popup) {
        reject(new Error("Impossible d'ouvrir la fenêtre popup. Vérifiez votre bloqueur de popup."))
        return
      }

      // Écouter les messages de la popup
      const handleMessage = (event: MessageEvent) => {
        // Vérifier l'origine pour la sécurité
        if (event.origin !== window.location.origin) return

        if (event.data.type === "oauth-success") {
          window.removeEventListener("message", handleMessage)
          popup.close()
          resolve(event.data.code)
        } else if (event.data.type === "oauth-error") {
          window.removeEventListener("message", handleMessage)
          popup.close()
          reject(new Error(event.data.error || "Erreur d'authentification"))
        }
      }

      window.addEventListener("message", handleMessage)

      // Vérifier si la popup est fermée
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed)
          window.removeEventListener("message", handleMessage)
          reject(new Error("Authentification annulée"))
        }
      }, 1000)
    })
  }, [])

  /**
   * Vérifie si un token est expiré ou va bientôt expirer
   */
  const isTokenExpired = useCallback((account: ConnectedAccount): boolean => {
    if (!account.expiresAt) {
      // If no expiry info, assume it might be expired
      return true
    }
    const nowInSeconds = Math.floor(Date.now() / 1000)
    return account.expiresAt <= nowInSeconds + TOKEN_EXPIRY_BUFFER_SECONDS
  }, [])

  /**
   * Rafraîchit le token d'un compte
   */
  const refreshToken = useCallback(
    async (account: ConnectedAccount): Promise<ConnectedAccount> => {
      if (!account.boiteMailId) {
        throw new Error("ID de boîte mail manquant pour le rafraîchissement du token")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/oauth/refresh-token/${account.boiteMailId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Échec du rafraîchissement du token")
      }

      const data = await response.json()
      return {
        ...account,
        accessToken: data.accessToken,
        expiresAt: data.expiresAt ? Math.floor(new Date(data.expiresAt).getTime() / 1000) : undefined,
      }
    },
    []
  )

  /**
   * Obtient un token valide pour un compte, en le rafraîchissant si nécessaire
   */
  const getValidToken = useCallback(
    async (account: ConnectedAccount): Promise<ConnectedAccount> => {
      if (isTokenExpired(account)) {
        console.log(`Token expiré pour ${account.email}, rafraîchissement en cours...`)
        const refreshedAccount = await refreshToken(account)
        // Update the account in state
        setConnectedAccounts((prev) =>
          prev.map((acc) =>
            acc.provider === account.provider && acc.email === account.email
              ? refreshedAccount
              : acc
          )
        )
        return refreshedAccount
      }
      return account
    },
    [isTokenExpired, refreshToken]
  )

  /**
   * Échange le code d'autorisation contre un access token
   */
  const exchangeCodeForToken = useCallback(
    async (provider: OAuthProvider, code: string): Promise<ConnectedAccount> => {
      // Appel à votre API backend pour échanger le code
      const response = await fetch(`/api/auth/${provider}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Échec de l'authentification")
      }

      const data = await response.json()
      return data as ConnectedAccount
    },
    []
  )

  /**
   * Connecte un compte email via OAuth2
   */
  const connectAccount = useCallback(
    async (provider: OAuthProvider): Promise<void> => {
      setIsLoading(true)

      try {
        // 1. Obtenir l'URL d'autorisation
        const authUrl =
          provider === "google"
            ? getGoogleAuthUrl()
            : provider === "microsoft" || provider === "microsoft365"
            ? getMicrosoftAuthUrl()
            : ""

        if (!authUrl) {
          throw new Error("Provider non supporté")
        }

        // 2. Ouvrir la popup OAuth
        const code = await openOAuthPopup(authUrl)

        // 3. Échanger le code contre un token
        const account = await exchangeCodeForToken(provider, code)

        // 4. Sauvegarder le compte connecté
        setConnectedAccounts((prev) => [...prev, account])
      } catch (error) {
        console.error("Erreur de connexion OAuth:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [getGoogleAuthUrl, getMicrosoftAuthUrl, openOAuthPopup, exchangeCodeForToken]
  )

  /**
   * Déconnecte un compte email
   */
  const disconnectAccount = useCallback(async (provider: OAuthProvider, email: string) => {
    try {
      // Appel à votre API backend pour révoquer le token
      await fetch(`/api/auth/${provider}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      // Supprimer le compte de la liste
      setConnectedAccounts((prev) => prev.filter((acc) => !(acc.provider === provider && acc.email === email)))
    } catch (error) {
      console.error("Erreur de déconnexion:", error)
      throw error
    }
  }, [])

  /**
   * Envoie un email via un compte connecté
   * Vérifie et rafraîchit le token si nécessaire avant l'envoi
   */
  const sendEmail = useCallback(
    async (
      provider: OAuthProvider,
      email: string,
      data: {
        to: string
        subject: string
        body: string
        cc?: string
      }
    ) => {
      let account = connectedAccounts.find((acc) => acc.provider === provider && acc.email === email)

      if (!account) {
        throw new Error("Compte non connecté")
      }

      // Vérifier et rafraîchir le token si expiré
      try {
        account = await getValidToken(account)
      } catch (refreshError) {
        console.error("Impossible de rafraîchir le token:", refreshError)
        throw new Error("Session expirée. Veuillez reconnecter votre compte email.")
      }

      // Appel à votre API backend pour envoyer l'email
      const response = await fetch(`/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          email,
          ...data,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Échec de l'envoi de l'email")
      }

      return await response.json()
    },
    [connectedAccounts, getValidToken]
  )

  return {
    connectedAccounts,
    isLoading,
    connectAccount,
    disconnectAccount,
    sendEmail,
    isTokenExpired,
    refreshToken,
    getValidToken,
  }
}
