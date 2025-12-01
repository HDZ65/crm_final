import { Suspense } from "react"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
      <SignupForm />
    </Suspense>
  )
}
