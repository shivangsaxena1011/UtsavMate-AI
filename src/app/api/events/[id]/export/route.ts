/**
 * @file route.ts
 * @module app/api/events/[id]/export
 * @description API route handler for exporting event plans into various standard formats.
 * Streams Markdown (.md), Budget CSV (.csv), Vendor CSV (.csv), or iCalendar (.ics).
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventPlan } from "@/lib/storage";
import { generateMarkdownPlan, generateBudgetCsv, generateVendorCsv, generateIcsCalendar } from "@/lib/export";
import { eventIdParamSchema, formatZodError } from "@/lib/validation/api";

/**
 * GET /api/events/[id]/export?format=markdown|csv-budget|csv-vendors|ics
 * Generates and streams downloadable export files for the requested event plan.
 *
 * @param req - Incoming NextRequest with query string format
 * @param context - Route context containing URL params
 * @returns File attachment response or 404/400 JSON error
 */
export async function GET(
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

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "markdown";
    const filenameSafe = plan.event.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    if (format === "csv-budget") {
      const csv = generateBudgetCsv(plan);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenameSafe}-budget.csv"`,
        },
      });
    }

    if (format === "csv-vendors") {
      const csv = generateVendorCsv(plan);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenameSafe}-vendors.csv"`,
        },
      });
    }

    if (format === "ics") {
      const ics = generateIcsCalendar(plan.event.title, plan.tasks);
      return new NextResponse(ics, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filenameSafe}-timeline.ics"`,
        },
      });
    }

    // Default: Markdown
    const md = generateMarkdownPlan(plan);
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameSafe}-plan.md"`,
      },
    });
  } catch (err: unknown) {
    console.error("Export error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate export file" },
      { status: 500 }
    );
  }
}
