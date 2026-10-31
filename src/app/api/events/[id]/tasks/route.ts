import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { TimelineTask } from "@/lib/types";

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

    const task: TimelineTask = await req.json();

    if (!task.id) {
      task.id = `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      task.eventId = id;
      plan.tasks.push(task);
    } else {
      const idx = plan.tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        plan.tasks[idx] = { ...plan.tasks[idx], ...task };
      } else {
        plan.tasks.push(task);
      }
    }

    saveEventPlan(plan);
    return NextResponse.json({ success: true, tasks: plan.tasks });
  } catch (err: unknown) {
    console.error("Failed to save task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
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

    const { taskId } = await req.json();
    plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
    saveEventPlan(plan);

    return NextResponse.json({ success: true, tasks: plan.tasks });
  } catch (err: unknown) {
    console.error("Failed to delete task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
