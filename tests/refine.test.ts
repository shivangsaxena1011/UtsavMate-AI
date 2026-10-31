/**
 * @file refine.test.ts
 * @module tests/refine
 * @description Comprehensive unit test suite for refinePlan and applyAction in src/lib/ai/refine.ts.
 * Verifies deterministic mathematical fast paths, eco-friendly queries, live Gemini provider integration,
 * failure recovery fallbacks, and executable action applications with event note auditing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refinePlan, applyAction, RefineResponse } from "../src/lib/ai/refine";
import { FullEventPlan, EventRecord, BudgetItem } from "../src/lib/types";

// Mock @google/genai module for isolated testing of AI provider behavior
vi.mock("@google/genai", () => {
  const generateContentMock = vi.fn();
  class MockGoogleGenAI {
    public models = {
      generateContent: generateContentMock,
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    __mockGenerateContent: generateContentMock,
  };
});

/**
 * Creates an isolated, fully populated FullEventPlan fixture for testing.
 */
function createSamplePlan(overrides?: Partial<FullEventPlan>): FullEventPlan {
  const baseEvent: EventRecord = {
    id: "evt-refine-test",
    userId: "user-test",
    title: "Sharma Family Sangeet & Reception",
    eventType: "wedding",
    eventDate: "2027-11-20",
    city: "Jaipur",
    guestCount: 200,
    totalBudget: 500000,
    currency: "INR",
    language: "en",
    notes: "Initial event notes",
    createdAt: "2026-10-31T10:00:00.000Z",
    updatedAt: "2026-10-31T10:00:00.000Z",
  };

  const baseBudget: BudgetItem[] = [
    {
      id: "b-venue",
      eventId: "evt-refine-test",
      category: "venue",
      name: "Heritage Haveli Lawn",
      estimatedAmount: 200000,
      actualAmount: 180000,
      status: "booked",
      notes: "Main lawn deposit paid",
    },
    {
      id: "b-catering",
      eventId: "evt-refine-test",
      category: "catering",
      name: "Rajasthani & Pan-Indian Buffet",
      estimatedAmount: 150000,
      actualAmount: 0,
      status: "planned",
      notes: "Per plate catering package",
    },
    {
      id: "b-decor",
      eventId: "evt-refine-test",
      category: "decor",
      name: "Floral Stage & Fairy Lights",
      estimatedAmount: 100000,
      actualAmount: 0,
      status: "planned",
    },
    {
      id: "b-invites",
      eventId: "evt-refine-test",
      category: "invitations",
      name: "Boxed Sweets & RSVP Cards",
      estimatedAmount: 50000,
      actualAmount: 0,
      status: "planned",
    },
  ];

  return {
    event: { ...baseEvent, ...(overrides?.event ?? {}) },
    budget: overrides?.budget ?? baseBudget.map((b) => ({ ...b })),
    tasks: overrides?.tasks ?? [],
    vendors: overrides?.vendors ?? [],
    ideas: overrides?.ideas ?? [],
    aiGenerated: overrides?.aiGenerated ?? false,
    aiProvider: overrides?.aiProvider ?? "deterministic_fallback",
    version: overrides?.version ?? 1,
  };
}

describe("src/lib/ai/refine.ts - refinePlan & applyAction Unit Test Suite", () => {
  const originalEnvKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalEnvKey !== undefined) {
      process.env.GEMINI_API_KEY = originalEnvKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Deterministic Fast Paths: Budget Reduction by Percentage
  // =========================================================================
  describe("Deterministic Fast Paths: Budget Reduction by Percentage", () => {
    it("reduces budget by explicit 15% with proportional target calculation", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Please reduce budget by 15%");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.suggestedAction).toBeDefined();
      expect(res.suggestedAction?.type).toBe("adjust_budget");
      expect(res.suggestedAction?.payload?.percentage).toBe(15);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(425000); // 500,000 * 0.85

      expect(res.answer).toContain("To reduce your budget by 15%");
      expect(res.answer).toContain("₹75,000"); // Savings
      expect(res.answer).toContain("₹4,25,000"); // Reduced total
      expect(res.answer).toContain("Seasonal & Local Flowers");
      expect(res.answer).toContain("Consolidate Buffet Counters");
      expect(res.answer).toContain("Digital Invitations");
      expect(res.answer).toContain("Single-Venue Synergy");
    });

    it("reduces budget by explicit 20% accurately", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Can we cut our budget by 20%?");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.suggestedAction?.type).toBe("adjust_budget");
      expect(res.suggestedAction?.payload?.percentage).toBe(20);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(400000); // 500,000 * 0.80
      expect(res.answer).toContain("To reduce your budget by 20%");
      expect(res.answer).toContain("₹1,00,000");
    });

    it("handles boundary condition of 0% budget reduction", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "reduce budget by 0%");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.suggestedAction?.payload?.percentage).toBe(0);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(500000);
      expect(res.answer).toContain("saving ₹0");
    });

    it("handles boundary condition of 100% budget reduction", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "reduce budget by 100%");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.suggestedAction?.payload?.percentage).toBe(100);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(0);
    });

    it("extracts percentage correctly even with multiple numbers in prompt", async () => {
      const plan = createSamplePlan();
      // "250 guests" vs "25%"
      const res = await refinePlan(plan, "We have 250 guests, can we reduce budget by 25%?");

      expect(res.suggestedAction?.payload?.percentage).toBe(25);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(375000); // 500,000 * 0.75
    });
  });

  // =========================================================================
  // 2. Deterministic Fast Paths: Budget Reduction without Percentage
  // =========================================================================
  describe("Deterministic Fast Paths: Budget Reduction without Percentage", () => {
    it("defaults to 10% reduction when no percentage is specified", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "How can we reduce our event budget?");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.suggestedAction).toBeDefined();
      expect(res.suggestedAction?.type).toBe("adjust_budget");
      expect(res.suggestedAction?.payload?.percentage).toBe(10);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(450000); // 500,000 * 0.90
      expect(res.answer).toContain("To reduce your budget by 10%");
      expect(res.answer).toContain("saving ₹50,000");
      expect(res.answer).toContain("₹4,50,000");
    });

    it("triggers default 10% reduction for colloquial phrases containing reduce and budget", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Please reduce the overall budget for this function");

      expect(res.suggestedAction?.type).toBe("adjust_budget");
      expect(res.suggestedAction?.payload?.percentage).toBe(10);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(450000);
    });

    it("triggers percentage detection when '%' sign is present without the word 'budget'", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Could we reduce 30% from the total?");

      expect(res.suggestedAction?.type).toBe("adjust_budget");
      expect(res.suggestedAction?.payload?.percentage).toBe(30);
      expect(res.suggestedAction?.payload?.targetBudget).toBe(350000);
    });
  });

  // =========================================================================
  // 3. Deterministic Fast Paths: Eco-Friendly & Sustainable Queries
  // =========================================================================
  describe("Deterministic Fast Paths: Eco-Friendly and Sustainable Queries", () => {
    it("returns cultural low-waste alternatives for 'eco-friendly' queries", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "How can we make this wedding eco-friendly?");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.suggestedAction).toBeUndefined(); // Information-only suggestion
      expect(res.answer).toContain(`impactful low-waste alternatives for ${plan.event.title}`);
      expect(res.answer).toContain("Compostable Leaf Plates (Patravalis)");
      expect(res.answer).toContain("Potted Plant Centerpieces");
      expect(res.answer).toContain("Clay Kulhads & Glass Pitchers");
      expect(res.answer).toContain("Fabric Draping & Fairy Lights");
    });

    it("matches 'sustainable' keyword deterministically", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Give me sustainable decoration and catering tips");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.answer).toContain("impactful low-waste alternatives");
      expect(res.answer).toContain("Patravalis");
    });

    it("matches 'low-waste' keyword deterministically", async () => {
      const plan = createSamplePlan();
      const res = await refinePlan(plan, "We want a zero-plastic, low-waste celebration");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.answer).toContain("impactful low-waste alternatives");
      expect(res.answer).toContain("Clay Kulhads");
    });
  });

  // =========================================================================
  // 4. Live AI Provider Integration and Fallback Handling
  // =========================================================================
  describe("Live AI Provider & Fallback Handling", () => {
    it("returns live AI recommendation when GEMINI_API_KEY is active and Gemini API succeeds", async () => {
      process.env.GEMINI_API_KEY = "test-live-gemini-key";

      const { __mockGenerateContent } = (await import("@google/genai")) as unknown as {
        __mockGenerateContent: ReturnType<typeof vi.fn>;
      };

      const mockAiResponse =
        "1. Host a royal entry with traditional Rajasthani nagada players.\n" +
        "2. Set up a live bangle-making stall for guests during high tea.\n" +
        "3. Curate a local folk music trio for welcoming attendees.";

      __mockGenerateContent.mockResolvedValueOnce({
        text: `   ${mockAiResponse}   `,
      });

      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Suggest authentic Rajasthani welcome rituals");

      expect(res.source).toBe("gemini");
      expect(res.answer).toBe(mockAiResponse);
      expect(__mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it("falls back to default message when Gemini returns empty string or blank whitespace", async () => {
      process.env.GEMINI_API_KEY = "test-live-gemini-key";

      const { __mockGenerateContent } = (await import("@google/genai")) as unknown as {
        __mockGenerateContent: ReturnType<typeof vi.fn>;
      };

      __mockGenerateContent.mockResolvedValueOnce({
        text: "     ",
      });

      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Tell me about contemporary floral setups");

      expect(res.source).toBe("gemini");
      expect(res.answer).toBe("Here are practical recommendations for your event.");
    });

    it("falls back to default message when Gemini response text property is undefined", async () => {
      process.env.GEMINI_API_KEY = "test-live-gemini-key";

      const { __mockGenerateContent } = (await import("@google/genai")) as unknown as {
        __mockGenerateContent: ReturnType<typeof vi.fn>;
      };

      __mockGenerateContent.mockResolvedValueOnce({
        text: undefined,
      });

      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Suggest guest entertainment");

      expect(res.source).toBe("gemini");
      expect(res.answer).toBe("Here are practical recommendations for your event.");
    });

    it("catches live Gemini API error (e.g. 429 Rate Limit) and gracefully falls back to deterministic suggestions", async () => {
      process.env.GEMINI_API_KEY = "test-live-gemini-key";
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { __mockGenerateContent } = (await import("@google/genai")) as unknown as {
        __mockGenerateContent: ReturnType<typeof vi.fn>;
      };

      __mockGenerateContent.mockRejectedValueOnce(
        new Error("429 Resource has been exhausted (e.g. check quota)")
      );

      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Suggest luxury lighting concepts");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.answer).toContain('Personalized suggestions for "Suggest luxury lighting concepts"');
      expect(res.answer).toContain("Jaipur");
      expect(res.answer).toContain("₹5,00,000");

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AI:refinePlan] Gemini model call failed"),
        expect.stringContaining("429 Resource has been exhausted")
      );
    });

    it("catches non-Error thrown exceptions (e.g. string or network abort) and gracefully falls back", async () => {
      process.env.GEMINI_API_KEY = "test-live-gemini-key";
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { __mockGenerateContent } = (await import("@google/genai")) as unknown as {
        __mockGenerateContent: ReturnType<typeof vi.fn>;
      };

      __mockGenerateContent.mockRejectedValueOnce("Uncaught socket timeout");

      const plan = createSamplePlan();
      const res = await refinePlan(plan, "Suggest unique photography angles");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.answer).toContain("Personalized suggestions for");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AI:refinePlan] Gemini model call failed"),
        "Uncaught socket timeout"
      );
    });

    it("returns generic fallback directly when GEMINI_API_KEY is absent", async () => {
      delete process.env.GEMINI_API_KEY;

      const plan = createSamplePlan();
      const res = await refinePlan(plan, "How can we structure the sangeet performances?");

      expect(res.source).toBe("deterministic_fallback");
      expect(res.answer).toContain(
        'Personalized suggestions for "How can we structure the sangeet performances?":'
      );
      expect(res.answer).toContain("Jaipur");
      expect(res.answer).toContain("target budget of ₹5,00,000");
    });
  });

  // =========================================================================
  // 5. applyAction Execution (Updating Event Notes & Modifying Budget Items)
  // =========================================================================
  describe("applyAction Execution", () => {
    it("applies 'adjust_budget' action, updating totalBudget, proportionally scaling items, and appending audit note", () => {
      const plan = createSamplePlan();
      const initialTotal = plan.event.totalBudget; // 500,000
      expect(initialTotal).toBe(500000);

      const action: NonNullable<RefineResponse["suggestedAction"]> = {
        type: "adjust_budget",
        payload: {
          targetBudget: 400000,
          percentage: 20,
        },
      };

      const updated = applyAction(plan, action);

      // Total budget is updated
      expect(updated.event.totalBudget).toBe(400000);

      // Budget items proportionally scaled by 400,000 / 500,000 = 0.8
      const venue = updated.budget.find((b) => b.id === "b-venue");
      const catering = updated.budget.find((b) => b.id === "b-catering");
      const decor = updated.budget.find((b) => b.id === "b-decor");
      const invites = updated.budget.find((b) => b.id === "b-invites");

      expect(venue?.estimatedAmount).toBe(160000); // 200,000 * 0.8
      expect(catering?.estimatedAmount).toBe(120000); // 150,000 * 0.8
      expect(decor?.estimatedAmount).toBe(80000); // 100,000 * 0.8
      expect(invites?.estimatedAmount).toBe(40000); // 50,000 * 0.8

      const totalScaled = updated.budget.reduce((acc, i) => acc + i.estimatedAmount, 0);
      expect(totalScaled).toBe(400000);

      // Event notes updated with audit trail preserving previous notes
      expect(updated.event.notes).toContain("Initial event notes");
      expect(updated.event.notes).toContain(
        "[Budget Adjusted]: Total budget modified from ₹5,00,000 to ₹4,00,000 (-20%)."
      );

      // updatedAt timestamp is refreshed
      expect(new Date(updated.event.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date("2026-10-31T10:00:00.000Z").getTime()
      );
    });

    it("applies 'adjust_budget' when event initially has no notes", () => {
      const plan = createSamplePlan();
      delete plan.event.notes;

      const action: NonNullable<RefineResponse["suggestedAction"]> = {
        type: "adjust_budget",
        payload: {
          targetBudget: 450000,
          percentage: 10,
        },
      };

      const updated = applyAction(plan, action);
      expect(updated.event.notes).toBe(
        "[Budget Adjusted]: Total budget modified from ₹5,00,000 to ₹4,50,000 (-10%)."
      );
    });

    it("applies 'adjust_budget' with a custom user note", () => {
      const plan = createSamplePlan();
      const action: NonNullable<RefineResponse["suggestedAction"]> = {
        type: "adjust_budget",
        payload: {
          targetBudget: 425000,
          percentage: 15,
        },
      };

      const updated = applyAction(
        plan,
        action,
        "Organizer approved 15% reduction after vendor renegotiation."
      );

      expect(updated.event.notes).toContain(
        "Organizer approved 15% reduction after vendor renegotiation."
      );
    });

    it("applies 'scale_guests' action, adjusting guest count, recalculating guest-dependent items, and updating notes", () => {
      const plan = createSamplePlan();
      expect(plan.event.guestCount).toBe(200);

      const action: NonNullable<RefineResponse["suggestedAction"]> = {
        type: "scale_guests",
        payload: {
          guestCount: 300,
        },
      };

      const updated = applyAction(plan, action);

      // Headcount updated
      expect(updated.event.guestCount).toBe(300);

      // Catering scaled up: 150,000 * (300 / 200) = 225,000
      const catering = updated.budget.find((b) => b.id === "b-catering");
      expect(catering?.estimatedAmount).toBe(225000);
      expect(catering?.notes).toContain("Scaled from 200 to 300 guests");

      // Invitations scaled up: 50,000 * (300 / 200) = 75,000
      const invites = updated.budget.find((b) => b.id === "b-invites");
      expect(invites?.estimatedAmount).toBe(75000);

      // Venue and decor are fixed items; must remain unchanged
      const venue = updated.budget.find((b) => b.id === "b-venue");
      const decor = updated.budget.find((b) => b.id === "b-decor");
      expect(venue?.estimatedAmount).toBe(200000);
      expect(decor?.estimatedAmount).toBe(100000);

      // Event notes updated with guest headcount audit note
      expect(updated.event.notes).toContain(
        "[Guest Count Scaled]: Guest headcount updated from 200 to 300."
      );
    });

    it("safely handles undefined action or unrecognized action types without mutations", () => {
      const plan = createSamplePlan();
      const copy = JSON.parse(JSON.stringify(plan));

      const res1 = applyAction(plan, undefined);
      expect(res1.event.totalBudget).toBe(copy.event.totalBudget);

      const res2 = applyAction(plan, {
        type: "unknown_action_type" as unknown as "adjust_budget",
      });
      expect(res2.event.totalBudget).toBe(copy.event.totalBudget);
    });

    it("handles zero total estimated amount in budget without NaN division errors", () => {
      const plan = createSamplePlan({
        budget: [],
      });

      const action: NonNullable<RefineResponse["suggestedAction"]> = {
        type: "adjust_budget",
        payload: {
          targetBudget: 350000,
          percentage: 30,
        },
      };

      const updated = applyAction(plan, action);
      expect(updated.event.totalBudget).toBe(350000);
      expect(updated.budget.length).toBe(0);
      expect(updated.event.notes).toContain("Total budget modified from ₹5,00,000 to ₹3,50,000");
    });
  });

  // =========================================================================
  // 6. End-to-End Refine & Apply Pipeline
  // =========================================================================
  describe("End-to-End: refinePlan -> applyAction Pipeline", () => {
    it("executes complete lifecycle: user query -> refinePlan -> applyAction -> verified plan state", async () => {
      const plan = createSamplePlan();

      // Step 1: User asks to reduce budget by 25%
      const refineResult = await refinePlan(plan, "Please reduce budget by 25% due to venue change");
      expect(refineResult.suggestedAction).toBeDefined();
      expect(refineResult.suggestedAction?.type).toBe("adjust_budget");

      // Step 2: Apply the returned suggestedAction
      const modifiedPlan = applyAction(plan, refineResult.suggestedAction);

      // Step 3: Verify the mutated state
      expect(modifiedPlan.event.totalBudget).toBe(375000);
      const totalEstimated = modifiedPlan.budget.reduce((acc, i) => acc + i.estimatedAmount, 0);
      expect(totalEstimated).toBe(375000);
      expect(modifiedPlan.event.notes).toContain(
        "[Budget Adjusted]: Total budget modified from ₹5,00,000 to ₹3,75,000 (-25%)."
      );
    });
  });
});
