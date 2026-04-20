import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Landing from "@/components/Landing";
import Dashboard from "@/components/Dashboard";
import ParticleField from "@/components/ParticleField";
import {
  earthApi,
  type AnalyzeResponse,
  type SimulateResponse,
} from "@/lib/earthApi";
import { toast } from "@/hooks/use-toast";

const Home = () => {
  const [stage, setStage] = useState<"landing" | "dashboard">("landing");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [analyze, setAnalyze] = useState<AnalyzeResponse | null>(null);
  const [sim, setSim] = useState<SimulateResponse | null>(null);

  const start = async (text: string) => {
    setLoading(true);
    setInput(text);
    try {
      const a = await earthApi.analyze(text);
      const s = await earthApi.simulate({
        carbon_score: a.carbon_score,
        water_usage: a.water_usage,
        waste_index: a.waste_index,
      });
      setAnalyze(a);
      setSim(s);
      setStage("dashboard");
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticleField />

      <AnimatePresence mode="wait">
        {stage === "landing" || !analyze || !sim ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Landing onSubmit={start} loading={loading} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard
              baseInput={input}
              baseAnalyze={analyze}
              baseSim={sim}
              onBack={() => {
                setStage("landing");
                setAnalyze(null);
                setSim(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Home;
