import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import EarthGlobe from "./EarthGlobe";
import GlassPanel from "./GlassPanel";
import { Button } from "@/components/ui/button";
import {
  earthApi,
  simulateFromScores,
  type AnalyzeResponse,
  type CompareResponse,
} from "@/lib/earthApi";

type Choices = {
  transport: number;
  diet: number;
  flights: number;
  shopping: number;
};

export default function ComparePane({
  baseAnalyze,
  baseInput,
  currentChoices,
  onBack,
}: {
  baseAnalyze: AnalyzeResponse;
  baseInput: string;
  currentChoices: Choices;
  onBack: () => void;
}) {
  const improved: Choices = {
    transport: Math.max(0, currentChoices.transport - 30),
    diet: Math.max(0, currentChoices.diet - 25),
    flights: Math.max(0, currentChoices.flights - 30),
    shopping: Math.max(0, currentChoices.shopping - 20),
  };

  const score = (c: Choices) => {
    const t = (c.transport - 50) * 0.4;
    const d = (c.diet - 50) * 0.25;
    const f = (c.flights - 50) * 0.3;
    const s = (c.shopping - 50) * 0.15;
    return Math.max(5, Math.min(99, baseAnalyze.carbon_score + t + d + f + s));
  };

  const currCarbon = score(currentChoices);
  const altCarbon = score(improved);
  const currSim = simulateFromScores(
    currCarbon,
    currCarbon - 5,
    currCarbon - 8,
  );
  const altSim = simulateFromScores(altCarbon, altCarbon - 5, altCarbon - 8);

  const [cmp, setCmp] = useState<CompareResponse | null>(null);
  console.log(cmp);
  useEffect(() => {
    earthApi
      .compare(
        { carbon_score: Math.round(currCarbon) },
        { carbon_score: Math.round(altCarbon) },
      )
      .then(setCmp);
  }, [currCarbon, altCarbon]);

  return (
    <div className="relative min-h-screen p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="font-mono text-xs uppercase tracking-widest text-secondary">
          Comparison Mode
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Side
          title="Current You"
          tone="amber"
          carbon={currCarbon}
          sim={currSim}
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <GlassPanel className="w-full text-center" glow="blue">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Carbon delta
            </div>
            <div className="my-2 font-mono text-4xl text-primary">
              {(altCarbon - currCarbon).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">lower is better</div>
          </GlassPanel>
          <GlassPanel className="w-full">
            {!cmp ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </div>
            ) : (
              <>
                <p className="text-sm">{cmp.impact_difference}</p>
                <div className="mt-3 space-y-1 font-mono text-xs">
                  <p>Your input: {baseInput}</p>
                  <div>
                    Pollution:{" "}
                    <span className="text-primary">
                      {cmp.visual_delta.pollution > 0 ? "+" : ""}
                      {cmp.visual_delta.pollution}
                    </span>
                  </div>
                  <div>
                    Forest:{" "}
                    <span className="text-primary">
                      {cmp.visual_delta.forest > 0 ? "+" : ""}
                      {cmp.visual_delta.forest}
                    </span>
                  </div>
                </div>
              </>
            )}
          </GlassPanel>
        </div>

        <Side
          title="Improved You"
          tone="green"
          carbon={altCarbon}
          sim={altSim}
        />
      </div>
    </div>
  );
}

function Side({
  title,
  tone,
  carbon,
  sim,
}: {
  title: string;
  tone: "green" | "amber";
  carbon: number;
  sim: ReturnType<typeof simulateFromScores>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <GlassPanel glow={tone} className="flex flex-col items-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
        <div className="my-2">
          <EarthGlobe
            pollution={sim.pollution_level}
            forest={sim.forest_density}
            ice={sim.ice_level}
            size={300}
            interactive={false}
          />
        </div>
        <div className="font-mono text-3xl">{Math.round(carbon)}</div>
        <div className="text-xs text-muted-foreground">carbon score</div>
      </GlassPanel>
      <GlassPanel>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-mono text-lg text-warning">
              +{sim.temperature_rise}°
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              temp
            </div>
          </div>
          <div>
            <div className="font-mono text-lg">{sim.pollution_level}</div>
            <div className="text-[10px] uppercase text-muted-foreground">
              pollution
            </div>
          </div>
          <div>
            <div className="font-mono text-lg text-primary">
              {sim.forest_density}%
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              forest
            </div>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
