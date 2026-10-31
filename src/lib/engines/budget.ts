import { BudgetCategory, BudgetItem, BudgetSummary, EventType } from "../types";

export const CATEGORY_LABELS: Record<BudgetCategory, string> = {
  venue: "Venue & Location",
  catering: "Catering & Beverages",
  decor: "Decoration & Floral",
  photography: "Photography & Video",
  entertainment: "Entertainment & Music",
  invitations: "Invitations & Stationery",
  attire: "Attire, Makeup & Styling",
  transport: "Logistics & Transport",
  contingency: "Contingency Fund",
  other: "Miscellaneous",
};

// Percentage splits per event type (must sum to 100)
export const DEFAULT_BUDGET_SPLITS: Record<EventType, Record<BudgetCategory, number>> = {
  wedding: {
    venue: 30,
    catering: 30,
    decor: 10,
    photography: 10,
    attire: 8,
    entertainment: 5,
    invitations: 2,
    transport: 2,
    contingency: 3,
    other: 0,
  },
  birthday: {
    catering: 35,
    venue: 20,
    entertainment: 15,
    decor: 10,
    invitations: 5,
    attire: 5,
    photography: 5,
    contingency: 5,
    transport: 0,
    other: 0,
  },
  anniversary: {
    venue: 35,
    catering: 30,
    decor: 12,
    photography: 10,
    entertainment: 5,
    invitations: 3,
    contingency: 5,
    attire: 0,
    transport: 0,
    other: 0,
  },
  college_fest: {
    entertainment: 35, // Artists, Sound, Stage
    venue: 20, // Ground, Lighting, Security
    catering: 15, // Food stalls, Refreshments
    decor: 10, // Branding, Stage Backdrop
    transport: 5, // Guest Logistics
    photography: 5, // Media coverage
    invitations: 3, // Passes, Marketing
    contingency: 7, // Surplus / Emergencies
    attire: 0,
    other: 0,
  },
  community: {
    catering: 35, // Prasad, Community feast, Refreshments
    venue: 25, // Hall, Tent, Sound & Seating
    decor: 15, // Puja/Festival decor, Lights
    entertainment: 10, // Cultural performers, Bhajan/Folk
    invitations: 3, // Flyers, Community notices
    transport: 2,
    photography: 3,
    contingency: 7,
    attire: 0,
    other: 0,
  },
  custom: {
    venue: 25,
    catering: 30,
    decor: 15,
    photography: 10,
    entertainment: 10,
    invitations: 3,
    contingency: 7,
    attire: 0,
    transport: 0,
    other: 0,
  },
};

/**
 * Generate initial budget lines based on event type and total budget.
 * Handles integer round-off by allocating the exact remainder to contingency.
 */
export function generateInitialBudget(
  eventType: EventType,
  totalBudget: number,
  eventId: string = "default"
): BudgetItem[] {
  const splits = DEFAULT_BUDGET_SPLITS[eventType] || DEFAULT_BUDGET_SPLITS.custom;
  const items: BudgetItem[] = [];
  let allocatedSum = 0;

  // Categories to create
  const categories = Object.keys(splits) as BudgetCategory[];

  for (const cat of categories) {
    const percent = splits[cat] || 0;
    if (percent > 0) {
      // Use Math.floor to keep integers, avoiding floating inaccuracies
      const estimated = Math.floor((totalBudget * percent) / 100);
      allocatedSum += estimated;
      items.push({
        id: `bgt-${cat}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        eventId,
        category: cat,
        name: CATEGORY_LABELS[cat],
        estimatedAmount: estimated,
        actualAmount: 0,
        notes: `Allocated ~${percent}% of overall budget`,
        status: "planned",
      });
    }
  }

  // Remainder allocation to contingency so items sum EXACTLY to totalBudget
  const remainder = totalBudget - allocatedSum;
  const contingencyItem = items.find((i) => i.category === "contingency");
  if (contingencyItem) {
    contingencyItem.estimatedAmount += remainder;
  } else if (remainder > 0) {
    items.push({
      id: `bgt-contingency-${Date.now().toString(36)}`,
      eventId,
      category: "contingency",
      name: CATEGORY_LABELS.contingency,
      estimatedAmount: remainder,
      actualAmount: 0,
      notes: "Contingency reserve for unforeseen expenses",
      status: "planned",
    });
  }

  return items;
}

/**
 * Computes authoritative financial metrics for a set of budget items.
 * Pure deterministic calculation.
 */
export function computeBudgetSummary(
  items: BudgetItem[],
  totalBudget: number,
  guestCount: number = 1
): BudgetSummary {
  const safeGuestCount = Math.max(1, guestCount);
  let totalEstimated = 0;
  let totalActual = 0;

  const categoryMap: Record<
    BudgetCategory,
    {
      category: BudgetCategory;
      label: string;
      estimated: number;
      actual: number;
      variance: number;
      percentageOfBudget: number;
      isOverspent: boolean;
    }
  > = {
    venue: { category: "venue", label: CATEGORY_LABELS.venue, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    catering: { category: "catering", label: CATEGORY_LABELS.catering, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    decor: { category: "decor", label: CATEGORY_LABELS.decor, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    photography: { category: "photography", label: CATEGORY_LABELS.photography, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    entertainment: { category: "entertainment", label: CATEGORY_LABELS.entertainment, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    invitations: { category: "invitations", label: CATEGORY_LABELS.invitations, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    attire: { category: "attire", label: CATEGORY_LABELS.attire, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    transport: { category: "transport", label: CATEGORY_LABELS.transport, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    contingency: { category: "contingency", label: CATEGORY_LABELS.contingency, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
    other: { category: "other", label: CATEGORY_LABELS.other, estimated: 0, actual: 0, variance: 0, percentageOfBudget: 0, isOverspent: false },
  };

  for (const item of items) {
    const est = Math.max(0, item.estimatedAmount || 0);
    const act = Math.max(0, item.actualAmount || 0);
    totalEstimated += est;
    totalActual += act;

    if (categoryMap[item.category]) {
      categoryMap[item.category].estimated += est;
      categoryMap[item.category].actual += act;
    }
  }

  const warnings: string[] = [];

  for (const cat of Object.keys(categoryMap) as BudgetCategory[]) {
    const entry = categoryMap[cat];
    entry.variance = entry.actual - entry.estimated;
    entry.percentageOfBudget = totalBudget > 0 ? Math.round((entry.estimated / totalBudget) * 100) : 0;
    if (entry.actual > entry.estimated && entry.estimated > 0) {
      entry.isOverspent = true;
      warnings.push(
        `${entry.label} has exceeded its estimate by ${formatINR(entry.variance)}.`
      );
    }
  }

  const remainingFromEstimated = totalBudget - totalEstimated;
  const remainingFromActual = totalBudget - totalActual;
  
  const hasCategoryOverspend = (Object.keys(categoryMap) as BudgetCategory[]).some(
    (cat) => categoryMap[cat].isOverspent
  );
  const isTotalOverspent = totalEstimated > totalBudget || totalActual > totalBudget;
  const isOverspent = isTotalOverspent || hasCategoryOverspend;

  const totalOverspentAmount = Math.max(
    0,
    Math.max(totalEstimated - totalBudget, totalActual - totalBudget)
  );

  let categoryOverspentSum = 0;
  for (const cat of Object.keys(categoryMap) as BudgetCategory[]) {
    if (categoryMap[cat].isOverspent) {
      categoryOverspentSum += categoryMap[cat].variance;
    }
  }

  const overspentAmount = totalOverspentAmount > 0 ? totalOverspentAmount : categoryOverspentSum;

  const utilizationPercentage =
    totalBudget > 0 ? Math.round((totalEstimated / totalBudget) * 100) : 0;

  if (totalEstimated > totalBudget) {
    warnings.unshift(
      `Total estimated plan (${formatINR(totalEstimated)}) exceeds your budget of ${formatINR(totalBudget)} by ${formatINR(totalEstimated - totalBudget)}.`
    );
  }

  return {
    totalBudget,
    totalEstimated,
    totalActual,
    remainingFromEstimated,
    remainingFromActual,
    utilizationPercentage,
    isOverspent,
    overspentAmount,
    costPerGuestEstimated: Math.round(totalEstimated / safeGuestCount),
    costPerGuestActual: Math.round(totalActual / safeGuestCount),
    categoryBreakdown: categoryMap,
    warnings,
  };
}

/**
 * Format currency in Indian numbering system (e.g., ₹4,00,000)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Recalculate catering and favor items proportionally when guest count changes
 */
export function recalculateForGuestCount(
  items: BudgetItem[],
  oldGuests: number,
  newGuests: number
): BudgetItem[] {
  if (oldGuests <= 0 || newGuests <= 0 || oldGuests === newGuests) return items;
  const ratio = newGuests / oldGuests;

  return items.map((item) => {
    // Only scale guest-dependent categories (catering, invitations/favors)
    if (item.category === "catering" || item.category === "invitations") {
      const newEstimated = Math.round(item.estimatedAmount * ratio);
      return {
        ...item,
        estimatedAmount: newEstimated,
        notes: `${item.notes || ""} (Scaled from ${oldGuests} to ${newGuests} guests)`.trim(),
      };
    }
    return item;
  });
}
