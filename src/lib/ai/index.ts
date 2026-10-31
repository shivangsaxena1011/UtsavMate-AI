import { EventRecord } from "../types";
import { GeneratedPlan } from "./types";
import { generateGeminiPlan } from "./gemini-provider";
import { generateDeterministicPlan } from "./fallback-provider";

export interface PlanGenerationResult {
  plan: GeneratedPlan;
  source: "gemini" | "deterministic_fallback";
  notice?: string;
}

export async function generateEventPlan(event: EventRecord): Promise<PlanGenerationResult> {
  // If Gemini API Key is configured, attempt live AI generation
  if (process.env.GEMINI_API_KEY) {
    try {
      const livePlan = await generateGeminiPlan(event);
      return {
        plan: livePlan,
        source: "gemini",
      };
    } catch (err: unknown) {
      console.warn("Live Gemini API generation failed or timed out, using deterministic fallback:", err);
      const fallbackPlan = generateDeterministicPlan(event);
      return {
        plan: fallbackPlan,
        source: "deterministic_fallback",
        notice: "AI service temporarily unavailable. Generated using intelligent deterministic planning rules.",
      };
    }
  }

  // Pure deterministic offline fallback
  const fallbackPlan = generateDeterministicPlan(event);
  return {
    plan: fallbackPlan,
    source: "deterministic_fallback",
    notice: "Generated using offline planning intelligence (no API key configured).",
  };
}
