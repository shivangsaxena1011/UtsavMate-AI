/**
 * @file route.ts
 * @module app/api/events/[id]/refine
 * @description API route handler for AI-powered and deterministic plan refinement.
 * Processes natural language prompts, returns actionable suggestions, and optionally applies changes.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { refinePlan, applyAction as applyRefineAction } from "@/lib/ai/refine";
import {
  eventIdParamSchema,
  refineRequestSchema,
  formatZodError,
} from "@/lib/validation/api";

/**
 * POST /api/events/[id]/refine
 * Submits an AI refinement prompt for the event plan with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing prompt and optional applyAction flag
 * @param context - Route context containing URL params
 * @returns JSON response with AI answer, suggested action, and updated plan
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

    const validated = refineRequestSchema.safeParse(body);
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

    const { prompt, applyAction } = validated.data;
    const result = await refinePlan(plan, prompt);

    // If user explicitly asked to apply the calculated financial action
    if (applyAction && result.suggestedAction) {
      applyRefineAction(plan, result.suggestedAction);
      saveEventPlan(plan);
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
