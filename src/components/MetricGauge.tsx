import { motion } from "motion/react";

type Props = {
  label: string;
  value: number;
  max?: number;
  tone?: "green" | "blue" | "amber";
  unit?: string;
};

export default function MetricGauge({
  label,
  value,
  max = 100,
  tone = "green",
  unit = "",
}: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const stroke =
    tone === "amber"
      ? "hsl(var(--warning))"
      : tone === "blue"
        ? "hsl(var(--secondary))"
        : "hsl(var(--primary))";

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            fill="none"
            opacity="0.4"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            stroke={stroke}
            strokeWidth="6"
            fill="none"
            strokeDasharray={c}
            strokeLinecap="round"
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${stroke})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl font-semibold">
            {Math.round(value)}
            {unit}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="text-sm text-foreground/80">
          {pct < 30
            ? "Low"
            : pct < 60
              ? "Moderate"
              : pct < 80
                ? "High"
                : "Critical"}
        </div>
      </div>
    </div>
  );
}
