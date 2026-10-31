/**
 * @file route.ts
 * @module app/api/events
 * @description Master events collection API route handler.
 * Provides event listing (GET) and new event plan synthesis (POST) with Zod validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { CreateEventInputSchema } from "@/lib/types";
import { createNewEvent, listEvents } from "@/lib/storage";

/**
 * GET /api/events
 * Lists all stored event summaries sorted by event date.
 *
 * @returns JSON response with array of stored events
 */
export async function GET() {
  try {
    const events = listEvents();
    return NextResponse.json({ success: true, events });
  } catch (err: unknown) {
    console.error("Failed to list events:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve events." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Validates CreateEventInputSchema and initializes a new event plan.
 *
 * @param req - Incoming NextRequest containing new event input parameters
 * @returns JSON response with newly initialized FullEventPlan (HTTP 201) or validation errors (HTTP 400)
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const validated = CreateEventInputSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const plan = await createNewEvent(validated.data);
    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create event:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error occurred while creating event." },
      { status: 500 }
    );
  }
}
