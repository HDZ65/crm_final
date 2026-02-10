/**
 * Mock implementation for development when gRPC services are unavailable
 * Replace imports in auth.server.ts to use this temporarily
 */

export async function getServerUserProfile() {
  // Return a mock user profile for development
  return {
    utilisateur: {
      id: "mock-user-id",
      keycloakId: "mock-keycloak-id",
      email: "dev@example.com",
      nom: "Developer",
      prenom: "Test",
      telephone: "",
      actif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    organisations: [
      {
        organisationId: "mock-org-id",
        organisationNom: "Test Organization",
        role: {
          id: "mock-role-id",
          code: "ADMIN",
          nom: "Administrateur",
        },
        etat: "actif",
      },
    ],
    hasOrganisation: true,
  };
}

export async function getActiveOrgIdFromCookie() {
  return "mock-org-id";
}
