import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { earthApi } from "@/lib/earthApi";
import TypingText from "./TypingText";
import { motion, AnimatePresence } from "motion/react";

type Msg = {
  role: "user" | "ai";
  text: string;
  suggestions?: string[];
  improvement?: number;
};

export default function CoachChat({
  carbonScore,
  lifestyle,
  onApply,
}: {
  carbonScore: number;
  lifestyle: string;
  onApply?: (suggestion: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: "Hi — I'm your EarthTwin coach. Ask how to lower your impact, or hit Suggest.",
    },
  ]);

  const send = async (msg: string) => {
    if (!msg.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    const res = await earthApi.coach(carbonScore, lifestyle, msg);
    setMsgs((m) => [
      ...m,
      {
        role: "ai",
        text: res.reply || "Here are a few changes I'd recommend.",
        suggestions: res.suggestions,
        improvement: res.improvement_score,
      },
    ]);
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="glass-strong gap-2 border border-primary/30 hover:bg-primary/10"
          variant="ghost"
        >
          <Sparkles className="h-4 w-4 text-primary" /> AI Coach
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="glass-strong w-full border-l border-border sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display mt-1">
            <Sparkles className="h-5 w-5 text-primary" /> EarthTwin Coach
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex h-[calc(100vh-100px)] flex-col px-2">
          <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pr-2">
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%]"
                      : "mr-auto max-w-[90%]"
                  }
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary/15 border border-primary/30" : "glass"}`}
                  >
                    {m.role === "ai" ? <TypingText text={m.text} /> : m.text}
                    {m.suggestions && (
                      <ul className="mt-3 space-y-1.5">
                        {m.suggestions.map((s, j) => (
                          <li
                            key={j}
                            className="flex items-center justify-between gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs"
                          >
                            <span>• {s}</span>
                            {onApply && (
                              <button
                                onClick={() => onApply(s)}
                                className="text-primary hover:underline"
                              >
                                apply
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {typeof m.improvement === "number" && (
                      <div className="mt-3">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Improvement potential
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted/40">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${m.improvement}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-primary to-secondary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Coach is
                  thinking…
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Ask the coach…"
              className="bg-input/60"
            />
            <Button
              onClick={() => send(input)}
              disabled={loading}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            className="mt-2 text-xs"
            onClick={() => send("How can I improve?")}
          >
            Suggest improvements ✨
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
