/**
 * @file index.ts
 * @module lib/ai
 * @description Gateway service for AI plan generation. Dispatches to live Google Gemini API
 * when configured, or transparently falls back to intelligent deterministic generation.
 */

import { EventRecord } from "../types";
import { GeneratedPlan } from "./types";
import { generateGeminiPlan } from "./gemini-provider";
import { generateDeterministicPlan } from "./fallback-provider";

/**
 * Result payload containing generated event plan and execution source metadata.
 */
export interface PlanGenerationResult {
  /** The generated plan containing thematic concepts, ideas, and advice */
  plan: GeneratedPlan;
  /** Originating generation engine */
  source: "gemini" | "deterministic_fallback";
  /** Informational notice if fallback was activated */
  notice?: string;
}

/**
 * Coordinates generation of culturally attuned event concepts, ideas, and cost-saving tips.
 *
 * @param event - The master event record specifications
 * @returns Promise resolving to GeneratedPlan and execution source metadata
 *
 * @example
 * ```ts
 * const result = await generateEventPlan(eventRecord);
 * console.log(`Plan generated via: ${result.source}`);
 * ```
 */
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
