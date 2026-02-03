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

const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "winaity";
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || "";

const KEYCLOAK_ADMIN_CLIENT_ID =
  process.env.KEYCLOAK_ADMIN_CLIENT_ID || process.env.KEYCLOAK_CLIENT_ID || "";
const KEYCLOAK_ADMIN_CLIENT_SECRET =
  process.env.KEYCLOAK_ADMIN_CLIENT_SECRET ||
  process.env.KEYCLOAK_CLIENT_SECRET ||
  "";

function getIssuerBase(): string {
  if (!KEYCLOAK_ISSUER) return "";
  return KEYCLOAK_ISSUER.replace(/\/realms\/[^/]+$/, "");
}

async function getAdminToken(): Promise<string> {
  const response = await fetch(`${KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: KEYCLOAK_ADMIN_CLIENT_ID,
      client_secret: KEYCLOAK_ADMIN_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error_description || "Failed to get admin token");
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Missing admin access token");
  }

  return data.access_token;
}

export async function createKeycloakUser(
  userData: CreateUserDto
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const token = await getAdminToken();
    const baseUrl = getIssuerBase();
    const adminUrl = `${baseUrl}/admin/realms/${KEYCLOAK_REALM}/users`;

    const userPayload: KeycloakUser = {
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

    const response = await fetch(adminUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userPayload),
    });

    if (response.status === 409) {
      return { success: false, error: "User already exists" };
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.message || "Failed to create user",
      };
    }

    const locationHeader = response.headers.get("location") || "";
    const userId = locationHeader.split("/").pop();

    return {
      success: true,
      userId: userId || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

export async function sendVerificationEmail(userId: string): Promise<boolean> {
  try {
    const token = await getAdminToken();
    const baseUrl = getIssuerBase();
    const url = `${baseUrl}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/send-verify-email`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
