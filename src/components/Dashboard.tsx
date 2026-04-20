import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Eye, GitCompare, Loader2 } from "lucide-react";
import EarthGlobe from "./EarthGlobe";
import ShareSnapshot from "./ShareSnapshot";
import GlassPanel from "./GlassPanel";
import MetricGauge from "./MetricGauge";
import MetricBar from "./MetricBar";
import LifestyleSlider from "./LifestyleSlider";
import TypingText from "./TypingText";
import CoachChat from "./CoachChat";
import FutureMode from "./FutureMode";
import ComparePane from "./ComparePane";
import { Button } from "@/components/ui/button";
import {
  earthApi,
  type AnalyzeResponse,
  type SimulateResponse,
} from "@/lib/earthApi";

type Props = {
  baseInput: string;
  baseAnalyze: AnalyzeResponse;
  baseSim: SimulateResponse;
  onBack: () => void;
};

type Choices = {
  transport: number;
  diet: number;
  flights: number;
  shopping: number;
};

function deriveScores(
  base: AnalyzeResponse,
  c: Choices,
): { carbon: number; water: number; waste: number } {
  const tDelta = (c.transport - 50) * 0.4;
  const dDelta = (c.diet - 50) * 0.25;
  const fDelta = (c.flights - 50) * 0.3;
  const sDelta = (c.shopping - 50) * 0.15;
  const carbon = Math.max(
    5,
    Math.min(99, base.carbon_score + tDelta + dDelta + fDelta + sDelta),
  );
  const water = Math.max(
    5,
    Math.min(99, base.water_usage + dDelta * 1.5 + sDelta),
  );
  const waste = Math.max(
    5,
    Math.min(99, base.waste_index + sDelta * 2 + dDelta * 0.5),
  );
  return { carbon, water, waste };
}

export default function Dashboard({
  baseInput,
  baseAnalyze,
  baseSim,
  onBack,
}: Props) {
  const [choices, setChoices] = useState<Choices>({
    transport: 50,
    diet: 50,
    flights: 50,
    shopping: 50,
  });
  const [sim, setSim] = useState<SimulateResponse>(baseSim);
  const [simLoading, setSimLoading] = useState(false);
  const [view, setView] = useState<"current" | "future" | "compare">("current");

  const scores = useMemo(
    () => deriveScores(baseAnalyze, choices),
    [baseAnalyze, choices],
  );
  const baseCarbon = baseAnalyze.carbon_score;
  const delta = scores.carbon - baseCarbon;

  useEffect(() => {
    const id = setTimeout(async () => {
      setSimLoading(true);
      const res = await earthApi.simulate({
        carbon_score: Math.round(scores.carbon),
        water_usage: Math.round(scores.water),
        waste_index: Math.round(scores.waste),
      });
      setSim(res);
      setSimLoading(false);
    }, 350);
    return () => clearTimeout(id);
  }, [scores.carbon, scores.water, scores.waste]);

  const lifestyleSummary = `${baseInput} | sliders: ${JSON.stringify(choices)}`;

  const applySuggestion = (s: string) => {
    const lower = s.toLowerCase();
    if (/bike|transit|car/.test(lower))
      setChoices((c) => ({ ...c, transport: Math.max(0, c.transport - 25) }));
    if (/plant|veg|meat/.test(lower))
      setChoices((c) => ({ ...c, diet: Math.max(0, c.diet - 25) }));
    if (/flight|rail|train|fly/.test(lower))
      setChoices((c) => ({ ...c, flights: Math.max(0, c.flights - 25) }));
    if (/order|shipping|wash|cloth/.test(lower))
      setChoices((c) => ({ ...c, shopping: Math.max(0, c.shopping - 25) }));
  };

  if (view === "future") {
    return (
      <FutureMode
        carbon={scores.carbon}
        sim={sim}
        onBack={() => setView("current")}
      />
    );
  }
  if (view === "compare") {
    return (
      <ComparePane
        baseAnalyze={baseAnalyze}
        baseInput={baseInput}
        currentChoices={choices}
        onBack={() => setView("current")}
      />
    );
  }

  return (
    <div className="relative min-h-screen p-4 md:p-8">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> New simulation
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            data-tour="future-btn"
            variant="ghost"
            size="sm"
            onClick={() => setView("future")}
            className="gap-2 border border-warning/30 hover:bg-warning/10"
          >
            <Eye className="h-4 w-4 text-warning" /> See 2035
          </Button>
          <Button
            data-tour="compare-btn"
            variant="ghost"
            size="sm"
            onClick={() => setView("compare")}
            className="gap-2 border border-secondary/30 hover:bg-secondary/10"
          >
            <GitCompare className="h-4 w-4 text-secondary" /> Compare
          </Button>
          <span data-tour="coach-btn">
            <CoachChat
              carbonScore={scores.carbon}
              lifestyle={lifestyleSummary}
              onApply={applySuggestion}
            />
          </span>
          <ShareSnapshot
            targetSelector="#earthtwin-snapshot"
            caption={`My EarthTwin — Carbon ${Math.round(scores.carbon)}`}
          />
        </div>
      </div>

      <div
        id="earthtwin-snapshot"
        className="grid gap-4 lg:grid-cols-[1fr_minmax(0,2fr)_1fr]"
      >
        {/* Left HUD */}
        <div className="space-y-4" data-tour="metrics">
          <GlassPanel glow="green">
            <MetricGauge
              label="Carbon Score"
              value={scores.carbon}
              tone={scores.carbon > 65 ? "amber" : "green"}
            />
          </GlassPanel>
          <GlassPanel glow="blue">
            <div className="space-y-3">
              <MetricBar label="Water Usage" value={scores.water} tone="blue" />
              <MetricBar
                label="Waste Index"
                value={scores.waste}
                tone="amber"
              />
              <MetricBar
                label="Forest Density"
                value={sim.forest_density}
                tone="green"
              />
            </div>
          </GlassPanel>
          <GlassPanel>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Delta vs baseline
            </div>
            <div
              className={`mt-1 font-mono text-2xl ${delta < 0 ? "text-primary" : delta > 0 ? "text-warning" : "text-muted-foreground"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}
            </div>
          </GlassPanel>
        </div>

        {/* Center: Earth */}
        <div
          className="relative flex flex-col items-center justify-center"
          data-tour="globe"
        >
          <div className="absolute h-[480px] w-[480px] rounded-full bg-primary/5 blur-3xl" />
          <EarthGlobe
            pollution={sim.pollution_level}
            forest={sim.forest_density}
            ice={sim.ice_level}
            size={480}
          />
          <AnimatePresence>
            {simLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
              >
                <Loader2 className="h-3 w-3 animate-spin" /> Re-simulating…
              </motion.div>
            )}
          </AnimatePresence>
          <GlassPanel className="mt-4 w-full max-w-xl">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              AI Summary
            </div>
            <TypingText className="mt-1 text-sm" text={baseAnalyze.summary} />
          </GlassPanel>
        </div>

        {/* Right HUD */}
        <div className="space-y-4">
          <GlassPanel glow="amber">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Planet Vitals
            </div>
            <div className="mt-3 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Temp rise</span>
                <span className="font-mono text-xl text-warning">
                  +{sim.temperature_rise}°C
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Ice caps</span>
                <span className="font-mono text-sm uppercase">
                  {sim.ice_level}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Pollution</span>
                <span className="font-mono text-sm">{sim.pollution_level}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm">State</span>
                <span className="font-mono text-xs uppercase">
                  {sim.visual_state?.replace("_", " ")}
                </span>
              </div>
            </div>
          </GlassPanel>
          <GlassPanel>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Your input
            </div>
            <p className="mt-2 text-sm italic text-foreground/80">
              "{baseInput}"
            </p>
          </GlassPanel>
        </div>
      </div>

      {/* Impact Slider Rail */}
      <GlassPanel className="mt-4" glow="green" data-tour="sliders">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Impact Sliders
            </div>
            <div className="text-sm">
              Move them to explore what-ifs — the planet updates live
            </div>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <LifestyleSlider
            label="Transport"
            leftIcon="🚲"
            rightIcon="🚗"
            leftLabel="Bike"
            rightLabel="Car"
            value={choices.transport}
            onChange={(v) => setChoices((c) => ({ ...c, transport: v }))}
          />
          <LifestyleSlider
            label="Diet"
            leftIcon="🥗"
            rightIcon="🥩"
            leftLabel="Plant"
            rightLabel="Meat"
            value={choices.diet}
            onChange={(v) => setChoices((c) => ({ ...c, diet: v }))}
          />
          <LifestyleSlider
            label="Flights"
            leftIcon="🚆"
            rightIcon="✈️"
            leftLabel="Rail"
            rightLabel="Frequent flyer"
            value={choices.flights}
            onChange={(v) => setChoices((c) => ({ ...c, flights: v }))}
          />
          <LifestyleSlider
            label="Shopping"
            leftIcon="♻️"
            rightIcon="🛍️"
            leftLabel="Thrift"
            rightLabel="Fast fashion"
            value={choices.shopping}
            onChange={(v) => setChoices((c) => ({ ...c, shopping: v }))}
          />
        </div>
      </GlassPanel>
    </div>
  );
}
