import { z } from "zod";

export const GeneratedThemeConceptSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  colorPalette: z.array(z.string()),
  vibe: z.string(),
});

export const GeneratedIdeaItemSchema = z.object({
  section: z.enum(["theme", "decor", "food", "activity", "favor", "saving"]),
  title: z.string(),
  description: z.string(),
  costTier: z.enum(["$", "$$", "$$$"]),
  tags: z.array(z.string()).optional(),
});

export const GeneratedPlanSchema = z.object({
  overview: z.string(),
  themeConcepts: z.array(GeneratedThemeConceptSchema).min(1),
  personalizedIdeas: z.array(GeneratedIdeaItemSchema).min(3),
  costSavingTips: z.array(z.string()).min(2),
  riskAndContingencies: z.array(z.string()).min(1),
  nextActionRecommendations: z.array(z.string()).min(2),
  culturalNotes: z.string().optional(),
});

export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;
