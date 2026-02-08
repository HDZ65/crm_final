"use server"

import { resetKeycloakUserPassword, sendPasswordResetEmail } from "@/lib/auth/keycloak-admin"

export async function requestPasswordResetAction(email: string) {
  try {
    const result = await sendPasswordResetEmail(email)
    if (!result.success) {
      return { success: false, error: result.error || "Erreur lors de l'envoi" }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function resetPasswordAction(token: string, newPassword: string) {
  try {
    // Token contains the userId from Keycloak's reset flow
    const result = await resetKeycloakUserPassword(token, newPassword)
    if (!result.success) {
      return { success: false, error: result.error || "Erreur lors de la réinitialisation" }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: "Une erreur est survenue" }
  }
}
