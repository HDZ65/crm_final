import { NextRequest, NextResponse } from "next/server";
import { createKeycloakUser } from "@/lib/auth/keycloak-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, prenom, email, password } = body;

    // Validation
    if (!email || !password || !nom || !prenom) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Create user in Keycloak
    const result = await createKeycloakUser({
      email,
      password,
      firstName: prenom,
      lastName: nom,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, userId: result.userId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
