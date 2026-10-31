import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { refinePlan } from "@/lib/ai/refine";
import { recalculateForGuestCount } from "@/lib/engines/budget";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plan = getEventPlan(id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const { prompt, applyAction } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { success: false, error: "Prompt string is required" },
        { status: 400 }
      );
    }

    const result = await refinePlan(plan, prompt);

    // If user explicitly asked to apply the calculated financial action
    if (applyAction && result.suggestedAction?.type === "adjust_budget") {
      const targetBudget = Number(result.suggestedAction.payload?.targetBudget);
      if (targetBudget > 0) {
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
        saveEventPlan(plan);
      }
    }

    if (applyAction && result.suggestedAction?.type === "scale_guests") {
      const newGuests = Number(result.suggestedAction.payload?.guestCount);
      if (newGuests > 0) {
        plan.budget = recalculateForGuestCount(plan.budget, plan.event.guestCount, newGuests);
        plan.event.guestCount = newGuests;
        saveEventPlan(plan);
      }
    }

    return NextResponse.json({
      success: true,
      answer: result.answer,
      suggestedAction: result.suggestedAction,
      source: result.source,
      updatedPlan: plan,
    });
  } catch (err: unknown) {
    console.error("Failed to refine plan:", err);
    return NextResponse.json(
      { success: false, error: "Failed to refine plan" },
      { status: 500 }
    );
  }
}
