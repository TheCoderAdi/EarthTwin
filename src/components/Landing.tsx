import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Loader2 } from "lucide-react";
import EarthGlobe from "./EarthGlobe";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLES = [
  "I drive 20km daily and eat meat",
  "Vegetarian, bike to work, no flights",
  "Frequent flyer, online shopping addict",
];

export default function Landing({
  onSubmit,
  loading,
}: {
  onSubmit: (input: string) => void;
  loading: boolean;
}) {
  const [text, setText] = useState("");

  return (
    <div className="relative grid min-h-screen items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-16">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-mono uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />{" "}
          EarthTwin AI
        </div>
        <h1 className="text-5xl font-bold leading-[1.05] md:text-6xl">
          See your <span className="neon-text">digital twin</span> of Earth.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Describe your lifestyle. Watch your planet respond — in real time, in
          3D.
        </p>

        <div className="mt-8 glass p-4" data-tour="lifestyle-input">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your lifestyle… e.g. 'I drive 10km daily, eat meat, fly twice a year'"
            className="min-h-[110px] resize-none border-0 bg-transparent text-base focus-visible:ring-0"
          />
          <div className="mt-3 flex flex-wrap gap-2" data-tour="examples">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setText(ex)}
                className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <Button
          data-tour="simulate-btn"
          size="lg"
          disabled={!text.trim() || loading}
          onClick={() => onSubmit(text)}
          className="mt-6 h-12 gap-2 bg-gradient-to-r from-primary to-secondary px-8 font-display text-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] transition hover:shadow-[0_0_40px_-2px_hsl(var(--primary)/0.8)]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Simulating…
            </>
          ) : (
            <>
              Simulate My Earth <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
        <div className="animate-float">
          <EarthGlobe
            pollution={35}
            forest={70}
            ice="stable"
            size={500}
            interactive={false}
          />
        </div>
      </motion.div>
    </div>
  );
}
