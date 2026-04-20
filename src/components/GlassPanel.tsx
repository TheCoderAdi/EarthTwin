import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";

type Props = HTMLMotionProps<"div"> & {
  glow?: "green" | "blue" | "amber" | "none";
};

const GlassPanel = forwardRef<HTMLDivElement, Props>(
  ({ className, glow = "none", children, ...props }, ref) => {
    const glowClass =
      glow === "green"
        ? "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.35)]"
        : glow === "blue"
          ? "shadow-[0_0_30px_-5px_hsl(var(--secondary)/0.35)]"
          : glow === "amber"
            ? "shadow-[0_0_30px_-5px_hsl(var(--warning)/0.35)]"
            : "";
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "glass p-5 transition-all hover:-translate-y-0.5",
          glowClass,
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
GlassPanel.displayName = "GlassPanel";
export default GlassPanel;
