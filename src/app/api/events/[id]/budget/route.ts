/**
 * @file route.ts
 * @module app/api/events/[id]/budget
 * @description API route handler for managing event budget line items.
 * Supports adding, updating, and deleting budget items with runtime Zod schema validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { BudgetItem } from "@/lib/types";
import {
  eventIdParamSchema,
  addBudgetItemSchema,
  deleteBudgetItemSchema,
  formatZodError,
} from "@/lib/validation/api";

/**
 * POST /api/events/[id]/budget
 * Adds a new budget item or updates an existing one with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing BudgetItem payload
 * @param context - Route context containing URL params
 * @returns JSON response with updated budget array or validation error details
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

    const validated = addBudgetItemSchema.safeParse(body);
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
      const newItem: BudgetItem = {
        id: `bgt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        eventId: id,
        category: data.category,
        name: data.name,
        estimatedAmount: data.estimatedAmount,
        actualAmount: data.actualAmount ?? 0,
        status: data.status ?? "planned",
        notes: data.notes,
      };
      plan.budget.push(newItem);
    } else {
      const idx = plan.budget.findIndex((b) => b.id === data.id);
      if (idx >= 0) {
        plan.budget[idx] = {
          ...plan.budget[idx],
          category: data.category,
          name: data.name,
          estimatedAmount: data.estimatedAmount,
          actualAmount: data.actualAmount ?? plan.budget[idx].actualAmount,
          status: data.status ?? plan.budget[idx].status,
          notes: data.notes ?? plan.budget[idx].notes,
        };
      } else {
        const newItem: BudgetItem = {
          id: data.id,
          eventId: id,
          category: data.category,
          name: data.name,
          estimatedAmount: data.estimatedAmount,
          actualAmount: data.actualAmount ?? 0,
          status: data.status ?? "planned",
          notes: data.notes,
        };
        plan.budget.push(newItem);
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

/**
 * DELETE /api/events/[id]/budget
 * Deletes a budget item by ID with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing itemId in JSON body
 * @param context - Route context containing URL params
 * @returns JSON response with updated budget array or error details
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

    const validated = deleteBudgetItemSchema.safeParse(body);
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

    plan.budget = plan.budget.filter((b) => b.id !== validated.data.itemId);
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

/**
 * PATCH /api/events/[id]/budget
 * Partially updates an existing budget item (e.g. actualAmount, estimatedAmount, status).
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

    const targetId = (body.id || body.itemId) as string | undefined;
    if (!targetId || typeof targetId !== "string") {
      return NextResponse.json(
        { success: false, error: "itemId or id is required for PATCH update" },
        { status: 400 }
      );
    }

    const itemIndex = plan.budget.findIndex((b) => b.id === targetId);
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Budget item not found" },
        { status: 404 }
      );
    }

    const existing = plan.budget[itemIndex];
    plan.budget[itemIndex] = {
      ...existing,
      ...(typeof body.name === "string" ? { name: body.name } : {}),
      ...(typeof body.estimatedAmount === "number" ? { estimatedAmount: body.estimatedAmount } : {}),
      ...(typeof body.actualAmount === "number" ? { actualAmount: body.actualAmount } : {}),
      ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
      ...(body.status === "planned" || body.status === "booked" || body.status === "paid"
        ? { status: body.status }
        : {}),
    };

    saveEventPlan(plan);
    return NextResponse.json({ success: true, budget: plan.budget });
  } catch (err: unknown) {
    console.error("Failed to patch budget item:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update budget item" },
      { status: 500 }
    );
  }
}
