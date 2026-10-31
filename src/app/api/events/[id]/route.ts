/**
 * @file route.ts
 * @module app/api/events/[id]
 * @description API route handler for managing single event plans.
 * Provides retrieval (GET), partial property updating (PATCH), and deletion (DELETE)
 * with strict Zod schema validation and route parameter verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan, deleteEvent } from "@/lib/storage";
import {
  eventIdParamSchema,
  patchEventSchema,
  formatZodError,
} from "@/lib/validation/api";

/**
 * GET /api/events/[id]
 * Retrieves event plan by ID with route parameter validation.
 *
 * @param _req - Incoming NextRequest
 * @param context - Route context containing URL params
 * @returns JSON response with full event plan or 404
 */
export async function GET(
  _req: NextRequest,
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
    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    console.error("Failed to get event plan:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve event plan" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]
 * Updates event record properties with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing partial EventRecord properties
 * @param context - Route context containing URL params
 * @returns JSON response with updated event plan or validation error details
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validated = patchEventSchema.safeParse(body);
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

    plan.event = {
      ...plan.event,
      ...validated.data,
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

/**
 * DELETE /api/events/[id]
 * Deletes an event by ID with route parameter validation.
 *
 * @param _req - Incoming NextRequest
 * @param context - Route context containing URL params
 * @returns JSON response indicating successful deletion or 404
 */
export async function DELETE(
  _req: NextRequest,
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
