import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan, deleteEvent } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
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
    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    console.error("Failed to get event plan:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve event plan" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const updates = await req.json();
    plan.event = {
      ...plan.event,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveEventPlan(plan);
    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    console.error("Failed to update event:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteEvent(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (err: unknown) {
    console.error("Failed to delete event:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
