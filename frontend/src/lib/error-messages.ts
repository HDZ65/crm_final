/**
 * Messages d'erreur backend traduits en français pour l'UX
 * Mappe les messages d'erreur bruts du backend vers des messages utilisateur compréhensibles
 */

export const BACKEND_ERROR_MESSAGES: Record<string, string> = {
  // === Authentification ===
  "Token JWT manquant": "Votre session a expiré. Veuillez vous reconnecter.",
  "Token JWT invalide": "Votre session a expiré. Veuillez vous reconnecter.",
  "Invalid token": "Votre session a expiré. Veuillez vous reconnecter.",
  "Unauthorized": "Vous devez être connecté pour effectuer cette action.",
  "Token expired": "Votre session a expiré. Veuillez vous reconnecter.",

  // === Permissions ===
  "Forbidden - insufficient permissions": "Vous n'avez pas les droits nécessaires pour cette action.",
  "Forbidden": "Vous n'avez pas les droits nécessaires pour cette action.",
  "Vous n'êtes pas membre de cette organisation": "Vous n'avez pas accès à cette organisation.",
  "Access denied": "Accès refusé.",

  // === Invitations ===
  "Une invitation est déjà en attente pour cet email":
    "Cette personne a déjà reçu une invitation. Vous pouvez la renvoyer depuis la liste des invitations.",
  "Cet utilisateur est déjà membre de l'organisation":
    "Cette personne fait déjà partie de votre équipe.",
  "Cette invitation a expiré":
    "L'invitation n'est plus valide. Demandez une nouvelle invitation à l'administrateur.",
  "Invitation not found": "Cette invitation n'existe pas ou a été supprimée.",
  "Invalid invitation token": "Le lien d'invitation n'est pas valide.",

  // === Ressources non trouvées ===
  "Organisation non trouvée": "L'organisation demandée n'existe pas.",
  "Client non trouvé": "Le client demandé n'existe pas.",
  "Contrat non trouvé": "Le contrat demandé n'existe pas.",
  "Utilisateur non trouvé": "L'utilisateur demandé n'existe pas.",
  "Not found": "La ressource demandée n'existe pas.",

  // === Validation ===
  "Bad Request": "Les données envoyées ne sont pas valides.",
  "Validation failed": "Veuillez vérifier les champs du formulaire.",
  "Invalid UUID": "Identifiant invalide.",
  "Invalid date format": "Format de date invalide.",

  // === Conflits ===
  "Email already exists": "Cette adresse email est déjà utilisée.",
  "Duplicate entry": "Cette entrée existe déjà.",
  "Resource already exists": "Cette ressource existe déjà.",

  // === Contrats ===
  "Contrat déjà activé": "Ce contrat est déjà actif.",
  "Contrat déjà suspendu": "Ce contrat est déjà suspendu.",
  "Contrat déjà résilié": "Ce contrat est déjà résilié.",
  "Impossible de résilier ce contrat": "La résiliation de ce contrat n'est pas possible actuellement.",

  // === Erreurs serveur ===
  "Internal server error": "Une erreur technique s'est produite. Veuillez réessayer plus tard.",
  "Service unavailable": "Le service est temporairement indisponible. Veuillez réessayer plus tard.",
  "Network error": "Problème de connexion. Vérifiez votre connexion internet.",
}

/**
 * Messages par code HTTP
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "Les données envoyées ne sont pas valides.",
  401: "Votre session a expiré. Veuillez vous reconnecter.",
  403: "Vous n'avez pas les droits nécessaires pour cette action.",
  404: "La ressource demandée n'existe pas.",
  409: "Cette action crée un conflit avec l'état actuel.",
  422: "Les données envoyées ne peuvent pas être traitées.",
  429: "Trop de requêtes. Veuillez patienter quelques instants.",
  500: "Une erreur technique s'est produite. Veuillez réessayer plus tard.",
  502: "Le serveur est temporairement indisponible.",
  503: "Le service est en maintenance. Veuillez réessayer plus tard.",
  504: "Le serveur met trop de temps à répondre. Veuillez réessayer.",
}

/**
 * Traduit un message d'erreur backend vers un message UX français
 * @param message - Le message d'erreur brut du backend
 * @param statusCode - Le code HTTP optionnel pour fallback
 * @returns Le message traduit ou le message original si non trouvé
 */
export function translateBackendError(message: string, statusCode?: number): string {
  // Chercher une correspondance exacte
  if (BACKEND_ERROR_MESSAGES[message]) {
    return BACKEND_ERROR_MESSAGES[message]
  }

  // Chercher une correspondance partielle (case-insensitive)
  const lowerMessage = message.toLowerCase()
  for (const [key, translation] of Object.entries(BACKEND_ERROR_MESSAGES)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return translation
    }
  }

  // Fallback sur le code HTTP
  if (statusCode && HTTP_STATUS_MESSAGES[statusCode]) {
    return HTTP_STATUS_MESSAGES[statusCode]
  }

  // Retourner le message original si aucune traduction
  return message
}

/**
 * Génère un message d'action suggérée selon l'erreur
 * @param statusCode - Le code HTTP de l'erreur
 * @returns Une suggestion d'action ou undefined
 */
export function getSuggestedAction(statusCode: number): string | undefined {
  switch (statusCode) {
    case 401:
      return "Se reconnecter"
    case 403:
      return "Contacter un administrateur"
    case 404:
      return "Retourner à l'accueil"
    case 429:
      return "Réessayer dans quelques secondes"
    case 500:
    case 502:
    case 503:
      return "Réessayer plus tard"
    default:
      return undefined
  }
}

/**
 * Extrait les erreurs de validation d'une réponse d'erreur backend
 * @param errorResponse - La réponse d'erreur du backend
 * @returns Un objet avec les champs en erreur et leurs messages
 */
export function extractValidationErrors(
  errorResponse: unknown
): Record<string, string[]> | null {
  if (!errorResponse || typeof errorResponse !== 'object') {
    return null
  }

  const response = errorResponse as Record<string, unknown>

  // Format NestJS class-validator
  if (Array.isArray(response.message)) {
    const errors: Record<string, string[]> = {}
    for (const msg of response.message) {
      if (typeof msg === 'object' && msg !== null) {
        const errorMsg = msg as { property?: string; constraints?: Record<string, string> }
        if (errorMsg.property && errorMsg.constraints) {
          errors[errorMsg.property] = Object.values(errorMsg.constraints)
        }
      } else if (typeof msg === 'string') {
        // Messages simples
        if (!errors._general) errors._general = []
        errors._general.push(msg)
      }
    }
    return Object.keys(errors).length > 0 ? errors : null
  }

  return null
}
