import { describe, it, expect } from "vitest";
import { generateInitialVendors, VENDOR_TEMPLATES } from "../src/lib/engines/vendors";
import { EventType } from "../src/lib/types";

describe("Vendor Coordination Engine", () => {
  const eventTypes: EventType[] = ["wedding", "birthday", "anniversary", "college_fest", "community", "custom"];

  it("provides vendor templates for all event types", () => {
    for (const type of eventTypes) {
      const templates = VENDOR_TEMPLATES[type];
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);

      // Verify each template has category, name, and questions
      for (const t of templates) {
        expect(t.category).toBeTruthy();
        expect(t.defaultName).toBeTruthy();
        expect(t.suggestedPercent).toBeGreaterThan(0);
        expect(t.questionsToAsk.length).toBeGreaterThan(0);
      }
    }
  });

  it("generates initial vendors with estimated quotes based on total budget", () => {
    const totalBudget = 500000;
    const vendors = generateInitialVendors("wedding", totalBudget);

    expect(vendors.length).toBeGreaterThanOrEqual(4);
    const venueVendor = vendors.find((v) => v.category === "Venue");
    expect(venueVendor).toBeDefined();
    expect(venueVendor!.estimatedQuote).toBeGreaterThan(0);
    expect(venueVendor!.status).toBe("not_contacted");
    expect(venueVendor?.questionsToAsk?.length ?? 0).toBeGreaterThan(0);
  });

  it("safely handles zero or negative total budget for vendors", () => {
    const vendorsZero = generateInitialVendors("birthday", 0);
    expect(vendorsZero.length).toBeGreaterThan(0);
    vendorsZero.forEach((v) => {
      expect(v.estimatedQuote).toBe(0);
    });

    const vendorsNegative = generateInitialVendors("community", -1000);
    expect(vendorsNegative.length).toBeGreaterThan(0);
    vendorsNegative.forEach((v) => {
      expect(v.estimatedQuote).toBe(0);
    });
  });
});
