export interface UserProfile {
  id?: string; // Keycloak user ID (sub claim)
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
  organizationId?: string;
}