import { GoogleGenAI } from "@google/genai";
import { FullEventPlan } from "../types";
import { formatINR } from "../engines/budget";

export interface RefineResponse {
  answer: string;
  suggestedAction?: {
    type: "adjust_budget" | "add_task" | "scale_guests";
    payload?: Record<string, unknown>;
  };
  source: "gemini" | "deterministic_fallback";
}

export async function refinePlan(
  plan: FullEventPlan,
  userPrompt: string
): Promise<RefineResponse> {
  const promptLower = userPrompt.toLowerCase();

  // Deterministic checks for common mathematical / budget requests
  if (promptLower.includes("reduce") && (promptLower.includes("budget") || promptLower.includes("%"))) {
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
    } catch {
      // Fallback on error
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
