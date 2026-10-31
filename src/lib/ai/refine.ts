/**
 * @file refine.ts
 * @module lib/ai/refine
 * @description Conversational refinement assistant for adjusting budgets, exploring sustainable alternatives,
 * and querying live Gemini model suggestions with deterministic fallbacks.
 */

import { GoogleGenAI } from "@google/genai";
import { FullEventPlan } from "../types";
import { formatINR, recalculateForGuestCount } from "../engines/budget";

/**
 * Structured response payload returned by the refine assistant.
 */
export interface RefineResponse {
  /** The conversational recommendation or answer text */
  answer: string;
  /** Optional machine-executable action (e.g. adjust budget or scale guests) */
  suggestedAction?: {
    type: "adjust_budget" | "add_task" | "scale_guests";
    payload?: Record<string, unknown>;
  };
  /** Attribution source indicating whether response was live AI or deterministic rule */
  source: "gemini" | "deterministic_fallback";
}

/**
 * Processes user refinement queries against an active event plan.
 * Detects financial requests (e.g. "reduce budget by 15%") or eco-friendly prompts deterministically,
 * or invokes the live Google Gemini API with graceful fallback logging.
 *
 * @param plan - Current FullEventPlan state
 * @param userPrompt - User's query or command string
 * @returns Promise resolving to structured RefineResponse
 *
 * @example
 * ```ts
 * const res = await refinePlan(plan, "reduce budget by 15%");
 * console.log(res.suggestedAction?.type); // "adjust_budget"
 * ```
 */
export async function refinePlan(
  plan: FullEventPlan,
  userPrompt: string
): Promise<RefineResponse> {
  const promptLower = userPrompt.toLowerCase();

  // Deterministic checks for common mathematical / budget requests
  const hasReductionWord =
    promptLower.includes("reduce") ||
    promptLower.includes("cut") ||
    promptLower.includes("lower") ||
    promptLower.includes("decrease");

  if (hasReductionWord && (promptLower.includes("budget") || promptLower.includes("%"))) {
    // Detect percentage (e.g. 10%, 15%, 20%)
    const match = promptLower.match(/(\d+)%/);
    const percent = match ? parseInt(match[1], 10) : 10;
    const currentTotal = plan.event.totalBudget;
    const reducedAmount = Math.round((currentTotal * (100 - percent)) / 100);
    const savings = currentTotal - reducedAmount;

    return {
      answer: `To reduce your budget by ${percent}% (saving ${formatINR(savings)}, bringing total to ${formatINR(reducedAmount)}):\n\n` +
        `1. **Opt for Seasonal & Local Flowers**: Switch from imported blooms to locally sourced marigolds, tuberoses, and greenery (saves ~30% on decor).\n` +
        `2. **Consolidate Buffet Counters**: Streamline 15-20 chafing dishes into 3-4 vibrant live counters (saves ~15% on catering without compromising guest delight).\n` +
        `3. **Digital Invitations**: Replace heavy boxed invites with animated WhatsApp video cards and an online RSVP tracker (saves ₹15,000–₹35,000).\n` +
        `4. **Single-Venue Synergy**: Host multiple ceremonies at the same banquet/lawn to eliminate duplicate transport and setup overheads.`,
      suggestedAction: {
        type: "adjust_budget",
        payload: { targetBudget: reducedAmount, percentage: percent },
      },
      source: "deterministic_fallback",
    };
  }

  if (promptLower.includes("low-waste") || promptLower.includes("eco-friendly") || promptLower.includes("sustainable")) {
    return {
      answer: `Here are impactful low-waste alternatives for ${plan.event.title}:\n\n` +
        `1. **Compostable Leaf Plates (Patravalis)**: Use pressed areca palm or sal leaf plates for appetizers, pairing tradition with zero plastic waste.\n` +
        `2. **Potted Plant Centerpieces**: Replace cut flower foam centerpieces with potted flowering plants (peace lilies, marigolds, succulents) that guests can take home as living favors.\n` +
        `3. **Clay Kulhads & Glass Pitchers**: Eliminate single-use PET plastic bottles by serving chai in terracotta kulhads and infusing water in glass urns.\n` +
        `4. **Fabric Draping & Fairy Lights**: Use reusable handloom dupattas and rental warm fairy light canopies instead of plastic balloons or thermocol backdrops.`,
      source: "deterministic_fallback",
    };
  }

  // If Gemini API Key is available, answer user-specific queries
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
You are UtsavMate AI, pair-planning this event with the organizer.
Event: ${plan.event.title} (${plan.event.eventType}) in ${plan.event.city}.
Guest Count: ${plan.event.guestCount}, Budget: ${formatINR(plan.event.totalBudget)}.
User Language: ${plan.event.language}.

User Request: "${userPrompt}"

Provide a direct, practical, and culturally nuanced answer. Include 3-4 specific suggestions tailored to Indian events. Keep budget feasibility in mind.
`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.5,
        },
      });

      return {
        answer: response.text?.trim() || "Here are practical recommendations for your event.",
        source: "gemini",
      };
    } catch (err: unknown) {
      console.warn(
        "[AI:refinePlan] Gemini model call failed; gracefully falling back to deterministic response:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // Generic fallback response
  return {
    answer: `Personalized suggestions for "${userPrompt}":\n\n` +
      `• Leverage local vendors in ${plan.event.city} for customized options.\n` +
      `• Focus on interactive elements (live food counters, photo corners, music) that leave a lasting memory.\n` +
      `• Ensure all details stay within your target budget of ${formatINR(plan.event.totalBudget)}.`,
    source: "deterministic_fallback",
  };
}

/**
 * Applies a suggested refine action directly to an event plan.
 * Proportionally adjusts budget line items, updates overall budget or guest counts,
 * and records an informative update note in the event notes field.
 *
 * @param plan - Current FullEventPlan state to modify
 * @param action - Optional suggestedAction from RefineResponse
 * @param customNote - Optional custom note override
 * @returns Modified FullEventPlan
 *
 * @example
 * ```ts
 * const res = await refinePlan(plan, "reduce budget by 10%");
 * applyAction(plan, res.suggestedAction);
 * console.log(plan.event.totalBudget);
 * ```
 */
export function applyAction(
  plan: FullEventPlan,
  action?: RefineResponse["suggestedAction"],
  customNote?: string
): FullEventPlan {
  if (!action) return plan;

  if (action.type === "adjust_budget") {
    const targetBudget = Number(action.payload?.targetBudget);
    if (!isNaN(targetBudget) && targetBudget >= 0) {
      const oldBudget = plan.event.totalBudget;
      plan.event.totalBudget = targetBudget;

      // Proportionally scale items to fit new target budget
      const totalEstimated = plan.budget.reduce((acc, i) => acc + i.estimatedAmount, 0);
      if (totalEstimated > 0) {
        const ratio = targetBudget / totalEstimated;
        plan.budget = plan.budget.map((b) => ({
          ...b,
          estimatedAmount: Math.round(b.estimatedAmount * ratio),
        }));
      }

      // Update event notes
      const pct = action.payload?.percentage;
      const pctText = pct !== undefined ? ` (-${pct}%)` : "";
      const auditNote =
        customNote ??
        `[Budget Adjusted]: Total budget modified from ${formatINR(oldBudget)} to ${formatINR(targetBudget)}${pctText}.`;
      plan.event.notes = plan.event.notes ? `${plan.event.notes}\n${auditNote}` : auditNote;
      plan.event.updatedAt = new Date().toISOString();
    }
  } else if (action.type === "scale_guests") {
    const newGuests = Number(action.payload?.guestCount);
    if (!isNaN(newGuests) && newGuests > 0) {
      const oldGuests = plan.event.guestCount;
      plan.budget = recalculateForGuestCount(plan.budget, oldGuests, newGuests);
      plan.event.guestCount = newGuests;

      const auditNote =
        customNote ??
        `[Guest Count Scaled]: Guest headcount updated from ${oldGuests} to ${newGuests}.`;
      plan.event.notes = plan.event.notes ? `${plan.event.notes}\n${auditNote}` : auditNote;
      plan.event.updatedAt = new Date().toISOString();
    }
  }

  return plan;
}

