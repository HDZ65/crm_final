/**
 * Mock implementation for development when gRPC services are unavailable
 * Replace imports in auth.server.ts to use this temporarily
 */

export async function getServerUserProfile() {
  // Return a mock user profile for development
  return {
    utilisateur: {
      id: "00000000-0000-4000-a000-000000000001",
      keycloakId: "00000000-0000-4000-a000-000000000002",
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
        organisationId: "00000000-0000-4000-a000-000000000010",
        organisationNom: "Test Organization",
        role: {
          id: "00000000-0000-4000-a000-000000000020",
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
  return "00000000-0000-4000-a000-000000000010";
}
