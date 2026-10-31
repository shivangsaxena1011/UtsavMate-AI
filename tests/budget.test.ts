import { describe, it, expect } from "vitest";
import {
  generateInitialBudget,
  computeBudgetSummary,
  recalculateForGuestCount,
  formatINR,
  DEFAULT_BUDGET_SPLITS,
} from "../src/lib/engines/budget";
import { EventType } from "../src/lib/types";

describe("Budget Engine", () => {
  it("verifies all default splits sum exactly to 100%", () => {
    const eventTypes: EventType[] = ["wedding", "birthday", "anniversary", "college_fest", "community", "custom"];
    for (const type of eventTypes) {
      const splits = DEFAULT_BUDGET_SPLITS[type];
      const sum = Object.values(splits).reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);
    }
  });

  it("generates budget lines that sum exactly to total budget (including remainder in contingency)", () => {
    // Test with an odd budget amount prone to rounding issues (e.g., 400,003)
    const totalBudget = 400003;
    const items = generateInitialBudget("wedding", totalBudget);

    const sum = items.reduce((acc, i) => acc + i.estimatedAmount, 0);
    expect(sum).toBe(totalBudget);

    const summary = computeBudgetSummary(items, totalBudget, 250);
    expect(summary.totalEstimated).toBe(totalBudget);
    expect(summary.remainingFromEstimated).toBe(0);
    expect(summary.isOverspent).toBe(false);
  });

  it("handles zero budget without throwing or NaN", () => {
    const items = generateInitialBudget("birthday", 0);
    const summary = computeBudgetSummary(items, 0, 50);

    expect(summary.totalEstimated).toBe(0);
    expect(summary.costPerGuestEstimated).toBe(0);
    expect(summary.utilizationPercentage).toBe(0);
    expect(summary.isOverspent).toBe(false);
  });

  it("detects overspending when actual spending exceeds estimated or total budget", () => {
    const items = generateInitialBudget("wedding", 500000);
    // Artificially increase actual spend on catering by ₹60,000
    const catering = items.find((i) => i.category === "catering")!;
    catering.actualAmount = catering.estimatedAmount + 60000;

    const summary = computeBudgetSummary(items, 500000, 200);
    expect(summary.isOverspent).toBe(true);
    expect(summary.overspentAmount).toBe(60000);
    expect(summary.warnings.length).toBeGreaterThan(0);
  });

  it("scales catering and invitations proportionally when guest count changes", () => {
    const items = generateInitialBudget("wedding", 400000);
    const originalCatering = items.find((i) => i.category === "catering")!.estimatedAmount;

    // Double the guests from 100 to 200
    const rescaled = recalculateForGuestCount(items, 100, 200);
    const newCatering = rescaled.find((i) => i.category === "catering")!.estimatedAmount;

    expect(newCatering).toBe(originalCatering * 2);
  });

  it("formats currency correctly in Indian numbering style", () => {
    const formatted = formatINR(400000);
    expect(formatted).toContain("4,00,000");
  });
});
