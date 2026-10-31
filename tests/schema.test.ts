import { describe, it, expect } from "vitest";
import { GeneratedPlanSchema } from "../src/lib/ai/types";
import { CreateEventInputSchema } from "../src/lib/types";

describe("AI Schema & Malformed Input Handling", () => {
  it("rejects incomplete or malformed AI outputs", () => {
    // Missing required arrays
    const badData1 = {
      overview: "A great event",
    };
    expect(GeneratedPlanSchema.safeParse(badData1).success).toBe(false);

    // Invalid cost tier
    const badData2 = {
      overview: "A great event",
      themeConcepts: [{ name: "T1", tagline: "Tag", description: "Desc", colorPalette: ["#000"], vibe: "Royal" }],
      personalizedIdeas: [
        { section: "decor", title: "Idea", description: "Desc", costTier: "$$$$$" }, // Invalid tier
      ],
      costSavingTips: ["Tip 1", "Tip 2"],
      riskAndContingencies: ["Risk 1"],
      nextActionRecommendations: ["Action 1", "Action 2"],
    };
    expect(GeneratedPlanSchema.safeParse(badData2).success).toBe(false);
  });

  it("safely accepts well-formed AI generated plans", () => {
    const validData = {
      overview: "Comprehensive wedding plan for Bhopal",
      themeConcepts: [
        {
          name: "Royal Pastel",
          tagline: "Elegance in Pastels",
          description: "Soft hues and floral canopies",
          colorPalette: ["#F9A8D4", "#C084FC"],
          vibe: "Regal yet subtle",
        },
      ],
      personalizedIdeas: [
        { section: "decor", title: "Floral Backdrop", description: "Locally sourced marigolds and tuberose", costTier: "$$" },
        { section: "food", title: "Awadhi Vegetarian Spread", description: "Biryani and live dessert counters", costTier: "$$$" },
        { section: "favor", title: "Seed Paper Thank You Cards", description: "Eco-friendly plantable seed cards", costTier: "$" },
      ],
      costSavingTips: [
        "Book off-peak weekdays to save up to 20% on hall rental.",
        "Combine haldi and mehendi decor setups with reusable backdrops.",
      ],
      riskAndContingencies: ["Power backup generator should be arranged with venue manager."],
      nextActionRecommendations: ["Schedule tasting session with caterer.", "Finalize photo booth backdrop."],
    };
    expect(GeneratedPlanSchema.safeParse(validData).success).toBe(true);
  });

  it("validates CreateEventInputSchema strictly", () => {
    // Valid input
    const validInput = {
      title: "Shivang & Priya Wedding",
      eventType: "wedding",
      eventDate: "2027-02-15",
      city: "Bhopal",
      guestCount: 250,
      totalBudget: 400000,
      theme: "Pastel Elegance",
      language: "en",
    };
    expect(CreateEventInputSchema.safeParse(validInput).success).toBe(true);

    // Missing required title
    const missingTitle = { ...validInput, title: "" };
    expect(CreateEventInputSchema.safeParse(missingTitle).success).toBe(false);

    // Negative budget
    const negativeBudget = { ...validInput, totalBudget: -500 };
    expect(CreateEventInputSchema.safeParse(negativeBudget).success).toBe(false);

    // Zero guest count
    const zeroGuests = { ...validInput, guestCount: 0 };
    expect(CreateEventInputSchema.safeParse(zeroGuests).success).toBe(false);

    // Invalid event type
    const invalidType = { ...validInput, eventType: "space_mission" };
    expect(CreateEventInputSchema.safeParse(invalidType).success).toBe(false);
  });

  it("safely sanitizes and handles untrusted user input without execution", () => {
    const untrustedUserInput = "<script>alert('xss')</script> Drop table users; --";
    const parsed = CreateEventInputSchema.safeParse({
      title: untrustedUserInput,
      eventType: "birthday",
      eventDate: "2027-06-20",
      city: "Indore",
      guestCount: 50,
      totalBudget: 50000,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe(untrustedUserInput);
    }
  });
});
