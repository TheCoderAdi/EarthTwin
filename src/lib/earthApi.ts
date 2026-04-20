export type LifestyleChoices = {
  transport: number;
  diet: number;
  flights: number;
  shopping: number;
};

export type AnalyzeResponse = {
  carbon_score: number;
  water_usage: number;
  waste_index: number;
  summary: string;
};

export type SimulateResponse = {
  temperature_rise: number;
  ice_level: "stable" | "melting" | "critical";
  forest_density: number;
  pollution_level: number;
  visual_state: string;
};

export type FutureResponse = {
  year: number;
  prediction: string;
};

export type CoachResponse = {
  suggestions: string[];
  improvement_score: number;
  reply?: string;
};

export type CompareResponse = {
  impact_difference: string;
  visual_delta: { pollution: number; forest: number };
};

const DEFAULT_URL = "http://localhost:5000";
const TIMEOUT_MS = 15000;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${DEFAULT_URL.replace(/\/$/, "")}${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).data as T;
  } catch (err) {
    clearTimeout(t);
    throw err;
  }
}

export function simulateFromScores(
  carbon: number,
  water: number,
  waste: number,
): SimulateResponse {
  return {
    temperature_rise: +(carbon * 0.03).toFixed(2),
    ice_level: carbon > 75 ? "critical" : carbon > 55 ? "melting" : "stable",
    forest_density: Math.max(5, 100 - carbon),
    pollution_level: Math.round(carbon * 0.6 + waste * 0.3 + water * 0.1),
    visual_state:
      carbon > 70 ? "high_pollution" : carbon > 40 ? "moderate" : "healthy",
  };
}

export const earthApi = {
  analyze: (input: string) =>
    postJson<AnalyzeResponse>("/api/earth/analyze", { input }),
  simulate: (data: {
    carbon_score: number;
    water_usage: number;
    waste_index: number;
  }) => postJson<SimulateResponse>("/api/earth/simulate", data),
  future: (carbon_score: number) =>
    postJson<FutureResponse>("/api/earth/future", { carbon_score }),
  coach: (carbon_score: number, lifestyle: string, message?: string) =>
    postJson<CoachResponse>("/api/earth/coach", {
      carbon_score,
      lifestyle,
      message,
    }),
  compare: (
    current: { carbon_score: number },
    alternative: { carbon_score: number },
  ) =>
    postJson<CompareResponse>("/api/earth/compare", { current, alternative }),
};
