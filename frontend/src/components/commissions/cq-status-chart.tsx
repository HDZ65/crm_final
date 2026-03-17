"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CQStatusChartProps {
  data?: {
    enAttente: number;
    enCours: number;
    valide: number;
    rejete: number;
    retour: number;
  };
}

const COLORS: Record<string, string> = {
  "En attente": "#9ca3af",
  "En cours": "#3b82f6",
  "Validé": "#22c55e",
  "Rejeté": "#ef4444",
  "Retour": "#f97316",
};

export function CQStatusChart({ data }: CQStatusChartProps) {
  const d = data ?? { enAttente: 0, enCours: 0, valide: 0, rejete: 0, retour: 0 };

  const chartData = [
    { name: "En attente", value: d.enAttente },
    { name: "En cours", value: d.enCours },
    { name: "Validé", value: d.valide },
    { name: "Rejeté", value: d.rejete },
    { name: "Retour", value: d.retour },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#9ca3af"} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
