import { NextRequest, NextResponse } from "next/server";
import { getEventPlan } from "@/lib/storage";
import { generateMarkdownPlan, generateBudgetCsv, generateVendorCsv, generateIcsCalendar } from "@/lib/export";

export async function GET(
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
