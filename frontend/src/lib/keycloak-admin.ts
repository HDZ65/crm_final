/**
 * Keycloak Admin API client for user management
 */

interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface KeycloakUser {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified: boolean;
  credentials?: Array<{
    type: string;
    value: string;
    temporary: boolean;
  }>;
}

/**
 * Get admin access token from Keycloak
 */
async function getAdminToken(): Promise<string> {
  const tokenUrl = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID || process.env.KEYCLOAK_ID!,
      client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || process.env.KEYCLOAK_SECRET!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get admin token:", error);
    throw new Error("Failed to get admin token");
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a new user in Keycloak
 */
export async function createKeycloakUser(
  userData: CreateUserDto
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const adminToken = await getAdminToken();
    const realm = process.env.KEYCLOAK_REALM || "master";
    const baseUrl = process.env.KEYCLOAK_ISSUER!.replace(`/realms/${realm}`, "");
    const createUserUrl = `${baseUrl}/admin/realms/${realm}/users`;

    const keycloakUser: KeycloakUser = {
      username: userData.email,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      emailVerified: false,
      credentials: [
        {
          type: "password",
          value: userData.password,
          temporary: false,
        },
      ],
    };

    const response = await fetch(createUserUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(keycloakUser),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 409) {
        return { success: false, error: "Un compte avec cet email existe déjà" };
      }

      return {
        success: false,
        error: errorData.errorMessage || "Erreur lors de la création du compte",
      };
    }

    // Extract user ID from Location header
    const location = response.headers.get("Location");
    const userId = location?.split("/").pop();

    return { success: true, userId };
  } catch (error) {
    console.error("Error creating Keycloak user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(userId: string): Promise<boolean> {
  try {
    const adminToken = await getAdminToken();
    const realm = process.env.KEYCLOAK_REALM || "master";
    const baseUrl = process.env.KEYCLOAK_ISSUER!.replace(`/realms/${realm}`, "");
    const verifyEmailUrl = `${baseUrl}/admin/realms/${realm}/users/${userId}/send-verify-email`;

    const response = await fetch(verifyEmailUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}
