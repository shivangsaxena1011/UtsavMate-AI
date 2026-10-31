import { describe, it, expect } from "vitest";
import { generateDeterministicPlan } from "../src/lib/ai/fallback-provider";
import { GeneratedPlanSchema } from "../src/lib/ai/types";
import { EventRecord } from "../src/lib/types";

describe("AI Fallback Provider", () => {
  const baseEvent: EventRecord = {
    id: "test-event-1",
    userId: "test-user",
    title: "Bhopal Wedding Reception",
    eventType: "wedding",
    eventDate: "2027-02-15",
    city: "Bhopal",
    guestCount: 250,
    totalBudget: 400000,
    currency: "INR",
    language: "en",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("produces valid structured output matching GeneratedPlanSchema for English", () => {
    const plan = generateDeterministicPlan(baseEvent);
    const parsed = GeneratedPlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.themeConcepts.length).toBeGreaterThanOrEqual(1);
    expect(plan.personalizedIdeas.length).toBeGreaterThanOrEqual(3);
    expect(plan.costSavingTips.length).toBeGreaterThanOrEqual(2);
  });

  it("supports Hindi language generation", () => {
    const hindiEvent: EventRecord = { ...baseEvent, language: "hi" };
    const plan = generateDeterministicPlan(hindiEvent);
    const parsed = GeneratedPlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.overview).toContain("अतिथियों");
  });

  it("supports Hinglish language generation", () => {
    const hinglishEvent: EventRecord = { ...baseEvent, language: "hinglish" };
    const plan = generateDeterministicPlan(hinglishEvent);
    const parsed = GeneratedPlanSchema.safeParse(plan);

    expect(parsed.success).toBe(true);
    expect(plan.overview).toContain("guests ke liye");
  });
});
