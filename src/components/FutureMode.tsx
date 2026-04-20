import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import EarthGlobe from "./EarthGlobe";
import GlassPanel from "./GlassPanel";
import TypingText from "./TypingText";
import { Button } from "@/components/ui/button";
import {
  earthApi,
  simulateFromScores,
  type SimulateResponse,
} from "@/lib/earthApi";

export default function FutureMode({
  carbon,
  sim,
  onBack,
}: {
  carbon: number;
  sim: SimulateResponse;
  onBack: () => void;
}) {
  const [prediction, setPrediction] = useState("");
  const [year, setYear] = useState(2035);
  const [loading, setLoading] = useState(true);

  // Project worse 2035 scenario
  const futureCarbon = Math.min(99, carbon + 18);
  const futureSim = simulateFromScores(
    futureCarbon,
    Math.min(99, carbon + 10),
    Math.min(99, carbon + 12),
  );

  useEffect(() => {
    setLoading(true);
    earthApi.future(carbon).then((r) => {
      setPrediction(r.prediction);
      setYear(r.year);
      setLoading(false);
    });
  }, [carbon]);

  return (
    <div className="relative min-h-screen p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="font-mono text-xs uppercase tracking-widest text-warning">
          Projection · Year {year}
        </div>
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative flex justify-center"
        >
          <div className="absolute h-[460px] w-[460px] rounded-full bg-warning/10 blur-3xl" />
          <EarthGlobe
            pollution={futureSim.pollution_level}
            forest={futureSim.forest_density}
            ice={futureSim.ice_level}
            mode="future"
            size={500}
          />
        </motion.div>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Earth in <span className="text-warning">{year}</span>
          </h2>
          <p className="text-muted-foreground">
            Based on your current trajectory, this is one plausible projection.
          </p>

          <GlassPanel glow="amber">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Forecasting…
              </div>
            ) : (
              <TypingText
                text={prediction}
                className="text-base leading-relaxed"
              />
            )}
          </GlassPanel>

          <div className="grid grid-cols-3 gap-3">
            <GlassPanel className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Temp rise
              </div>
              <div className="font-mono text-2xl text-warning">
                +{futureSim.temperature_rise}°C
              </div>
            </GlassPanel>
            <GlassPanel className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Ice caps
              </div>
              <div className="font-mono text-sm uppercase">
                {futureSim.ice_level}
              </div>
            </GlassPanel>
            <GlassPanel className="text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Forests
              </div>
              <div className="font-mono text-2xl text-primary">
                {futureSim.forest_density}%
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
