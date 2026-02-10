import { ResetPasswordForm } from "@/components/reset-password-form"
import Link from "next/link"

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token;

  // Si aucun token n'est fourni, rediriger ou afficher un message d'erreur
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-6 text-white text-center p-8">
        <div className="flex flex-col gap-4 max-w-md">
          <h1 className="text-2xl font-bold">Lien invalide</h1>
          <p className="text-background">
            Le lien de réinitialisation est invalide ou a expiré.
            Veuillez demander un nouveau lien de réinitialisation.
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Demander un nouveau lien
            </Link>
            <Link
              href="/login"
              className="text-background hover:text-primary transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />
}
