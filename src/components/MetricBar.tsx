import { motion } from "motion/react";

type Props = {
  label: string;
  value: number;
  tone?: "green" | "blue" | "amber";
};

export default function MetricBar({ label, value, tone = "blue" }: Props) {
  const color =
    tone === "amber"
      ? "hsl(var(--warning))"
      : tone === "green"
        ? "hsl(var(--primary))"
        : "hsl(var(--secondary))";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-sm">{Math.round(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
    </div>
  );
}
