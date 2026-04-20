import { Slider } from "@/components/ui/slider";

type Props = {
  label: string;
  leftIcon: string;
  rightIcon: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
};

export default function LifestyleSlider({
  label,
  leftIcon,
  rightIcon,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-foreground/70">{value}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-lg" title={leftLabel}>
          {leftIcon}
        </span>
        <Slider
          value={[value]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <span className="text-lg" title={rightLabel}>
          {rightIcon}
        </span>
      </div>
    </div>
  );
}
