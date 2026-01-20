"use client"

import * as React from "react"
import { useAuth } from "@/hooks/auth"

/**
 * Rôles disponibles dans le système
 */
export type AppRole =
  | 'user'
  | 'commercial'
  | 'comptable'
  | 'manager'
  | 'admin'

/**
 * Mapping des rôles Keycloak vers les rôles de l'application
 */
export const KEYCLOAK_ROLE_PREFIX = 'realm:'

interface RoleGuardProps {
  /**
   * Rôle(s) requis pour afficher le contenu
   * Si un tableau est fourni, l'utilisateur doit avoir AU MOINS UN des rôles
   */
  roles: AppRole | AppRole[]
  /**
   * Contenu à afficher si l'utilisateur a le rôle requis
   */
  children: React.ReactNode
  /**
   * Contenu à afficher si l'utilisateur n'a pas le rôle requis
   * @default null (rien ne s'affiche)
   */
  fallback?: React.ReactNode
  /**
   * Si true, requiert TOUS les rôles spécifiés (AND)
   * Si false (défaut), requiert AU MOINS UN des rôles (OR)
   */
  requireAll?: boolean
}

/**
 * Composant pour contrôler l'affichage basé sur les rôles utilisateur
 *
 * @example
 * ```tsx
 * // Affiche uniquement pour les admins
 * <RoleGuard roles="admin">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * // Affiche pour les managers OU admins
 * <RoleGuard roles={['manager', 'admin']}>
 *   <ManagementTools />
 * </RoleGuard>
 *
 * // Affiche un message alternatif si pas le bon rôle
 * <RoleGuard roles="admin" fallback={<p>Accès réservé aux administrateurs</p>}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, isAuthenticated } = useAuth()

  // Si l'utilisateur n'est pas authentifié, ne rien afficher
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  const roleArray = Array.isArray(roles) ? roles : [roles]

  // Vérifier les rôles
  let hasAccess: boolean
  if (requireAll) {
    // L'utilisateur doit avoir TOUS les rôles
    hasAccess = roleArray.every(role => hasRole(role))
  } else {
    // L'utilisateur doit avoir AU MOINS UN des rôles
    hasAccess = hasAnyRole(roleArray)
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

interface RoleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Rôle(s) requis pour que le bouton soit actif
   */
  roles: AppRole | AppRole[]
  /**
   * Si true, le bouton est masqué complètement (au lieu d'être désactivé)
   */
  hideIfUnauthorized?: boolean
  /**
   * Message à afficher dans le tooltip si l'utilisateur n'a pas les droits
   */
  unauthorizedTooltip?: string
}

/**
 * Bouton qui se désactive ou se masque selon les rôles de l'utilisateur
 *
 * @example
 * ```tsx
 * <RoleButton roles="admin" onClick={handleDelete}>
 *   Supprimer
 * </RoleButton>
 * ```
 */
export function RoleButton({
  roles,
  hideIfUnauthorized = false,
  unauthorizedTooltip = "Vous n'avez pas les droits nécessaires",
  children,
  disabled,
  ...props
}: RoleButtonProps) {
  const { hasAnyRole, isAuthenticated } = useAuth()

  const roleArray = Array.isArray(roles) ? roles : [roles]
  const hasAccess = isAuthenticated && hasAnyRole(roleArray)

  if (!hasAccess && hideIfUnauthorized) {
    return null
  }

  return (
    <button
      {...props}
      disabled={disabled || !hasAccess}
      title={!hasAccess ? unauthorizedTooltip : props.title}
    >
      {children}
    </button>
  )
}

/**
 * Hook pour vérifier facilement les rôles dans les composants
 *
 * @example
 * ```tsx
 * const { canEdit, canDelete, canManage } = useRoleCheck()
 *
 * if (canDelete) {
 *   // Afficher le bouton de suppression
 * }
 * ```
 */
export function useRoleCheck() {
  const { hasRole, hasAnyRole, isAuthenticated, profile } = useAuth()

  return {
    /** Utilisateur authentifié */
    isAuthenticated,
    /** Peut voir les données de base */
    canView: isAuthenticated && hasRole('user'),
    /** Peut créer/modifier des contrats */
    canEdit: isAuthenticated && hasAnyRole(['commercial', 'manager', 'admin']),
    /** Peut supprimer des données */
    canDelete: isAuthenticated && hasAnyRole(['manager', 'admin']),
    /** Peut gérer les utilisateurs et l'organisation */
    canManage: isAuthenticated && hasAnyRole(['manager', 'admin']),
    /** Accès administrateur complet */
    isAdmin: isAuthenticated && hasRole('admin'),
    /** Peut gérer la comptabilité */
    canAccountant: isAuthenticated && hasAnyRole(['comptable', 'admin']),
    /** Rôles de l'utilisateur */
    roles: profile?.roles || [],
    /** Vérifier un rôle spécifique */
    hasRole,
    /** Vérifier si l'utilisateur a l'un des rôles */
    hasAnyRole,
  }
}

/**
 * HOC pour protéger un composant entier par rôle
 *
 * @example
 * ```tsx
 * const AdminOnlyComponent = withRoleGuard(MyComponent, ['admin'])
 * ```
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  roles: AppRole | AppRole[],
  fallback?: React.ReactNode
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard roles={roles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}
