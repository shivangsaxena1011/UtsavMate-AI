/**
 * @file route.ts
 * @module app/api/events/[id]/tasks
 * @description API route handler for managing event timeline tasks.
 * Provides addition, modification, and deletion of milestones with strict Zod validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { TimelineTask } from "@/lib/types";
import {
  eventIdParamSchema,
  addTaskSchema,
  deleteTaskSchema,
  formatZodError,
} from "@/lib/validation/api";

/**
 * POST /api/events/[id]/tasks
 * Adds a new task or updates an existing one with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing task payload
 * @param context - Route context containing URL params
 * @returns JSON response with updated tasks array or validation error details
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const parsedParams = eventIdParamSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event ID parameter",
          details: formatZodError(parsedParams.error),
        },
        { status: 400 }
      );
    }
    const { id } = parsedParams.data;

    const plan = getEventPlan(id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validated = addTaskSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: formatZodError(validated.error),
        },
        { status: 400 }
      );
    }

    const data = validated.data;

    if (!data.id) {
      const newTask: TimelineTask = {
        id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        eventId: id,
        title: data.title,
        description: data.description ?? "",
        category: data.category,
        dueDate: data.dueDate,
        priority: data.priority,
        status: data.status,
        notes: data.notes,
        isOverdue: data.isOverdue ?? false,
      };
      plan.tasks.push(newTask);
    } else {
      const idx = plan.tasks.findIndex((t) => t.id === data.id);
      if (idx >= 0) {
        plan.tasks[idx] = {
          ...plan.tasks[idx],
          title: data.title,
          description: data.description ?? plan.tasks[idx].description,
          category: data.category,
          dueDate: data.dueDate,
          priority: data.priority,
          status: data.status,
          notes: data.notes ?? plan.tasks[idx].notes,
          isOverdue: data.isOverdue ?? plan.tasks[idx].isOverdue,
        };
      } else {
        const newTask: TimelineTask = {
          id: data.id,
          eventId: id,
          title: data.title,
          description: data.description ?? "",
          category: data.category,
          dueDate: data.dueDate,
          priority: data.priority,
          status: data.status,
          notes: data.notes,
          isOverdue: data.isOverdue ?? false,
        };
        plan.tasks.push(newTask);
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

/**
 * DELETE /api/events/[id]/tasks
 * Deletes a task by ID with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing taskId in JSON body
 * @param context - Route context containing URL params
 * @returns JSON response with updated tasks array or error details
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const parsedParams = eventIdParamSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event ID parameter",
          details: formatZodError(parsedParams.error),
        },
        { status: 400 }
      );
    }
    const { id } = parsedParams.data;

    const plan = getEventPlan(id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validated = deleteTaskSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: formatZodError(validated.error),
        },
        { status: 400 }
      );
    }

    plan.tasks = plan.tasks.filter((t) => t.id !== validated.data.taskId);
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

/**
 * PATCH /api/events/[id]/tasks
 * Partially updates an existing task (e.g. status, priority, dueDate).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const parsedParams = eventIdParamSchema.safeParse(rawParams);
    if (!parsedParams.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event ID parameter",
          details: formatZodError(parsedParams.error),
        },
        { status: 400 }
      );
    }
    const { id } = parsedParams.data;

    const plan = getEventPlan(id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const targetId = (body.id || body.taskId) as string | undefined;
    if (!targetId || typeof targetId !== "string") {
      return NextResponse.json(
        { success: false, error: "taskId or id is required for PATCH update" },
        { status: 400 }
      );
    }

    const taskIndex = plan.tasks.findIndex((t) => t.id === targetId);
    if (taskIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const existing = plan.tasks[taskIndex];
    plan.tasks[taskIndex] = {
      ...existing,
      ...(typeof body.title === "string" ? { title: body.title } : {}),
      ...(typeof body.description === "string" ? { description: body.description } : {}),
      ...(typeof body.category === "string" ? { category: body.category } : {}),
      ...(typeof body.dueDate === "string" ? { dueDate: body.dueDate } : {}),
      ...(body.priority === "high" || body.priority === "medium" || body.priority === "low"
        ? { priority: body.priority }
        : {}),
      ...(body.status === "pending" || body.status === "in_progress" || body.status === "completed"
        ? { status: body.status }
        : {}),
      ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
      ...(typeof body.isOverdue === "boolean" ? { isOverdue: body.isOverdue } : {}),
    };

    saveEventPlan(plan);
    return NextResponse.json({ success: true, tasks: plan.tasks });
  } catch (err: unknown) {
    console.error("Failed to patch task:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update task" },
      { status: 500 }
    );
  }
}
