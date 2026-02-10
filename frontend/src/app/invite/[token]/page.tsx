"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useValidateInvitation, useAcceptInvitation } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Building2, UserPlus } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { isAuthenticated, login } = useAuth();
  const { validation, error: validationError, validateInvitation } = useValidateInvitation();
  const { acceptInvitation } = useAcceptInvitation();
  // Loading states not provided by hooks
  const isValidating = false;
  const isAccepting = false;

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "accepting" | "success" | "error" | "already_member">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Valider le token au chargement
  useEffect(() => {
    if (token) {
      validateInvitation(token).then((data) => {
        if (data?.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      }).catch(() => {
        setStatus("invalid");
      });
    }
  }, [token, validateInvitation]);

  // Accepter l'invitation
  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Rediriger vers Keycloak avec callback vers cette page
      // NextAuth va rediriger automatiquement ici après l'authentification
      login(window.location.href);
      return;
    }

    setStatus("accepting");
    try {
      const response = await acceptInvitation(token);
      if (response?.success) {
        setStatus("success");
        // Rediriger vers le dashboard après 2 secondes
        // Les données utilisateur seront rechargées automatiquement
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setStatus("error");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";

      // Déjà membre
      if (message.includes("déjà membre")) {
        setStatus("already_member");
      }
      // Invitation expirée
      else if (message.includes("expir")) {
        setErrorMessage("Cette invitation a expiré. Demandez une nouvelle invitation à l'administrateur.");
        setStatus("error");
      }
      // Invitation déjà utilisée
      else if (message.includes("déjà utilisé") || message.includes("already used")) {
        setErrorMessage("Cette invitation a déjà été utilisée.");
        setStatus("error");
      }
      // Email ne correspond pas
      else if (message.includes("email") && message.includes("correspond")) {
        setErrorMessage("Votre email ne correspond pas à celui de l'invitation. Connectez-vous avec le bon compte.");
        setStatus("error");
      }
      // Invitation annulée
      else if (message.includes("annul") || message.includes("cancel")) {
        setErrorMessage("Cette invitation a été annulée.");
        setStatus("error");
      }
      // Organisation inactive
      else if (message.includes("organisation") && (message.includes("inactiv") || message.includes("désactiv"))) {
        setErrorMessage("Cette organisation n'est plus active.");
        setStatus("error");
      }
      // Erreur générique
      else {
        setErrorMessage(message || "Une erreur est survenue lors de l'acceptation de l'invitation.");
        setStatus("error");
      }
    }
  };


  // Écran de chargement
  if (status === "loading" || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground">Vérification de l&apos;invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation invalide ou expirée
  if (status === "invalid" || validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <XCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Invitation invalide</h2>
            <p className="text-muted-foreground mb-6">
              Cette invitation n&apos;existe pas ou a expiré.
            </p>
            <Button onClick={() => router.push("/")} variant="outline">
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation acceptée avec succès
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Bienvenue !</h2>
            <p className="text-muted-foreground mb-6">
              Vous avez rejoint <strong>{validation?.organisationNom}</strong> avec succès.
              <br />
              Redirection en cours...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Déjà membre de l'organisation
  if (status === "already_member") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Déjà membre</h2>
            <p className="text-muted-foreground mb-6">
              Vous êtes déjà membre de <strong>{validation?.organisationNom}</strong>.
            </p>
            <Button onClick={() => router.push("/")} variant="default">
              Accéder au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erreur lors de l'acceptation
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <XCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Erreur</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage || "Une erreur est survenue lors de l&apos;acceptation de l&apos;invitation."}
            </p>
            <Button onClick={handleAccept} variant="default" className="mr-2">
              Réessayer
            </Button>
            <Button onClick={() => router.push("/")} variant="outline">
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation valide - Afficher les détails et le bouton d'acceptation
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Building2 size={32} />
          </div>
          <CardTitle className="text-2xl">Invitation à rejoindre</CardTitle>
          <CardDescription>
            Vous êtes invité à rejoindre une organisation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organisation</span>
              <span className="font-semibold">{validation?.organisationNom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rôle</span>
              <span className="font-semibold">{validation?.roleNom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-semibold">{validation?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expire le</span>
              <span className="font-semibold">
                {validation?.expireAt
                  ? new Date(validation.expireAt).toLocaleDateString("fr-FR")
                  : "-"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full"
            size="lg"
          >
            {isAccepting ? (
              "Acceptation en cours..."
            ) : !isAuthenticated ? (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Se connecter et accepter
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Accepter l&apos;invitation
              </>
            )}
          </Button>

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center">
              Vous devez vous connecter pour accepter cette invitation
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
