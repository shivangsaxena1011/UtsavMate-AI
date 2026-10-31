import { describe, it, expect } from "vitest";
import { createNewEvent, getEventPlan, deleteEvent, listEvents } from "../src/lib/storage";
import { CreateEventInputSchema } from "../src/lib/types";
import { generateMarkdownPlan, generateBudgetCsv, generateVendorCsv } from "../src/lib/export";
import { computeBudgetSummary } from "../src/lib/engines/budget";

describe("Storage & API Integration", () => {
  it("validates input schema strictly and rejects invalid requests", () => {
    // Missing title and negative budget
    const invalid = {
      title: "",
      eventType: "wedding",
      eventDate: "not-a-date",
      city: "Bhopal",
      guestCount: -5,
      totalBudget: -100,
    };

    const result = CreateEventInputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("creates, saves, retrieves, and deletes an event plan", async () => {
    // Preserve and mock environment to guarantee offline deterministic speed in tests
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const newEvent = await createNewEvent({
        title: "Integration Test Celebration",
        eventType: "birthday",
        eventDate: "2027-05-10",
        city: "Indore",
        guestCount: 60,
        totalBudget: 80000,
        language: "en",
      });

      expect(newEvent.event.id).toBeDefined();
      expect(newEvent.budget.length).toBeGreaterThan(0);
      expect(newEvent.tasks.length).toBeGreaterThan(0);
      expect(newEvent.vendors.length).toBeGreaterThan(0);

      // Retrieve from disk
      const fetched = getEventPlan(newEvent.event.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.event.title).toBe("Integration Test Celebration");

      // Compute summary
      const summary = computeBudgetSummary(fetched!.budget, fetched!.event.totalBudget, 60);
      expect(summary.totalEstimated).toBe(80000);

      // Export verification
      const md = generateMarkdownPlan(fetched!);
      expect(md).toContain("# Integration Test Celebration");
      expect(md).toContain("Indore");

      const csvBudget = generateBudgetCsv(fetched!);
      expect(csvBudget).toContain("Estimated Amount (INR)");

      const csvVendors = generateVendorCsv(fetched!);
      expect(csvVendors).toContain("Business Name");

      // Clean up
      const deleted = deleteEvent(newEvent.event.id);
      expect(deleted).toBe(true);

      const recheck = getEventPlan(newEvent.event.id);
      expect(recheck).toBeNull();
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("lists all available events and correctly parses them from storage", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const created = await createNewEvent({
        title: "Listing Test Event",
        eventType: "anniversary",
        eventDate: "2027-08-20",
        city: "Mumbai",
        guestCount: 50,
        totalBudget: 150000,
        language: "en",
      });

      const events = listEvents();
      expect(events.length).toBeGreaterThanOrEqual(1);
      const found = events.find((e) => e.id === created.event.id);
      expect(found).toBeDefined();
      expect(found!.city).toBe("Mumbai");
      expect(found!.totalBudget).toBe(150000);

      deleteEvent(created.event.id);
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
