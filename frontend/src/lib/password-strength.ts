export interface PasswordStrength {
  score: number; // 0-3 (Faible, Moyen, Fort)
  label: string;
  color: string;
  criteria: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
  };
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const criteria = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  // Calculate score based on criteria met (out of 4 now)
  const criteriaMet = Object.values(criteria).filter(Boolean).length;

  let score = 0;
  let label = "Faible";
  let color = "hsl(0 84% 60%)"; // red

  if (criteriaMet === 0 || password.length === 0) {
    score = 0;
    label = "Faible";
    color = "hsl(0 84% 60%)"; // red
  } else if (criteriaMet <= 2) {
    score = 1;
    label = "Faible";
    color = "hsl(0 84% 60%)"; // red
  } else if (criteriaMet === 3) {
    score = 2;
    label = "Moyen";
    color = "hsl(38 92% 50%)"; // orange
  } else if (criteriaMet === 4) {
    score = 3;
    label = "Fort";
    color = "hsl(142 76% 36%)"; // green
  }

  return {
    score,
    label,
    color,
    criteria,
  };
}
