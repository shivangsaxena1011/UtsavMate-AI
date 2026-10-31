import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { BudgetItem } from "@/lib/types";

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

    const item: BudgetItem = await req.json();

    if (!item.id) {
      item.id = `bgt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      item.eventId = id;
      plan.budget.push(item);
    } else {
      const idx = plan.budget.findIndex((b) => b.id === item.id);
      if (idx >= 0) {
        plan.budget[idx] = { ...plan.budget[idx], ...item };
      } else {
        plan.budget.push(item);
      }
    }

    saveEventPlan(plan);
    return NextResponse.json({ success: true, budget: plan.budget });
  } catch (err: unknown) {
    console.error("Failed to save budget item:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update budget item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { itemId } = await req.json();
    plan.budget = plan.budget.filter((b) => b.id !== itemId);
    saveEventPlan(plan);

    return NextResponse.json({ success: true, budget: plan.budget });
  } catch (err: unknown) {
    console.error("Failed to delete budget item:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete budget item" },
      { status: 500 }
    );
  }
}
