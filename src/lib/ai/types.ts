/**
 * @file types.ts
 * @module lib/ai/types
 * @description Zod validation schemas and TypeScript definitions for AI-generated event plans,
 * theme concepts, personalized inspiration ideas, and risk contingencies.
 */

import { z } from "zod";

/**
 * Zod schema validating an individual thematic concept.
 */
export const GeneratedThemeConceptSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  colorPalette: z.array(z.string()),
  vibe: z.string(),
});

/**
 * Zod schema validating a personalized inspiration idea card.
 */
export const GeneratedIdeaItemSchema = z.object({
  section: z.enum(["theme", "decor", "food", "activity", "favor", "saving"]),
  title: z.string(),
  description: z.string(),
  costTier: z.enum(["$", "$$", "$$$"]),
  tags: z.array(z.string()).optional(),
});

/**
 * Zod schema validating an aggregate AI-generated event plan.
 */
export const GeneratedPlanSchema = z.object({
  overview: z.string(),
  themeConcepts: z.array(GeneratedThemeConceptSchema).min(1),
  personalizedIdeas: z.array(GeneratedIdeaItemSchema).min(3),
  costSavingTips: z.array(z.string()).min(2),
  riskAndContingencies: z.array(z.string()).min(1),
  nextActionRecommendations: z.array(z.string()).min(2),
  culturalNotes: z.string().optional(),
});

/**
 * Inferred TypeScript type of a validated AI generated event plan.
 */
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;
