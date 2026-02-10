import { checkPasswordStrength, type PasswordStrength } from "@/lib/security/password-strength";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = checkPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <CriteriaItem
        met={strength.criteria.length}
        label="Au moins 8 caractères"
      />
      <CriteriaItem
        met={strength.criteria.lowercase}
        label="Une lettre minuscule"
      />
      <CriteriaItem
        met={strength.criteria.uppercase}
        label="Une lettre majuscule"
      />
      <CriteriaItem
        met={strength.criteria.number}
        label="Un chiffre"
      />
    </div>
  );
}

interface CriteriaItemProps {
  met: boolean;
  label: string;
}

function CriteriaItem({ met, label }: CriteriaItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="size-4 text-green-600 dark:text-green-500" />
      ) : (
        <X className="size-4 text-muted-foreground/50" />
      )}
      <span className={met ? "text-white" : "text-muted/80"}>
        {label}
      </span>
    </div>
  );
}
