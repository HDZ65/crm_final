/**
 * Types pour les invitations et membres d'organisation
 */

// ============================================
// Membres d'organisation
// ============================================

export interface OrganisationMemberUtilisateur {
  id: string
  email: string
  nom: string
  prenom: string
}

export interface OrganisationMemberRole {
  id: string
  code: string
  nom: string
}

export interface OrganisationMember {
  id: string
  organisationId: string
  utilisateurId: string
  roleId: string
  etat: string
  dateInvitation: string
  dateActivation: string | null
  createdAt: string
  updatedAt: string
  utilisateur: OrganisationMemberUtilisateur
  role?: OrganisationMemberRole
}

// ============================================
// Invitations
// ============================================

export interface Invitation {
  id: string
  organisationNom: string
  email: string
  roleNom: string
  token: string
  inviteUrl: string
  expireAt: string
  etat: string
}

export interface InvitationValidation {
  valid: boolean
  organisationNom: string
  email: string
  roleNom: string
  expireAt: string
}

export interface InvitationAcceptResponse {
  success: boolean
  organisation: { id: string; nom: string }
  utilisateur: { id: string; email: string }
  membre: { id: string; roleId: string; etat: string }
}

export interface CreateInvitationDto {
  emailInvite: string
  roleId?: string
}

// ============================================
// Rôle utilisateur
// ============================================

export interface MyRoleMembre {
  id: string
  organisationId: string
  utilisateurId: string
  roleId: string
  etat: string
  dateInvitation: string | null
  dateActivation: string | null
  createdAt: string
  updatedAt: string
}

export interface MyRoleRole {
  id: string
  code: string
  nom: string
}

export interface MyRoleResponse {
  membre: MyRoleMembre
  role: MyRoleRole
}
