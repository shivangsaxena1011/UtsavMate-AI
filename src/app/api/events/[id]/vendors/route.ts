/**
 * @file route.ts
 * @module app/api/events/[id]/vendors
 * @description API route handler for managing vendor records.
 * Provides addition, modification, and deletion of vendor contacts with strict Zod validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { Vendor } from "@/lib/types";
import {
  eventIdParamSchema,
  addVendorSchema,
  deleteVendorSchema,
  formatZodError,
} from "@/lib/validation/api";

/**
 * POST /api/events/[id]/vendors
 * Adds a new vendor or updates an existing vendor record with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing Vendor payload
 * @param context - Route context containing URL params
 * @returns JSON response with updated vendors array or validation error details
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

    const validated = addVendorSchema.safeParse(body);
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
      const newVendor: Vendor = {
        id: `vnd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        eventId: id,
        category: data.category,
        businessName: data.businessName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email || undefined,
        estimatedQuote: data.estimatedQuote,
        finalQuote: data.finalQuote,
        status: data.status,
        paymentNotes: data.paymentNotes,
        notes: data.notes,
        followUpDate: data.followUpDate || undefined,
        questionsToAsk: data.questionsToAsk,
      };
      plan.vendors.push(newVendor);
    } else {
      const idx = plan.vendors.findIndex((v) => v.id === data.id);
      if (idx >= 0) {
        plan.vendors[idx] = {
          ...plan.vendors[idx],
          category: data.category,
          businessName: data.businessName,
          contactPerson: data.contactPerson ?? plan.vendors[idx].contactPerson,
          phone: data.phone ?? plan.vendors[idx].phone,
          email: data.email || plan.vendors[idx].email,
          estimatedQuote: data.estimatedQuote,
          finalQuote: data.finalQuote,
          status: data.status,
          paymentNotes: data.paymentNotes ?? plan.vendors[idx].paymentNotes,
          notes: data.notes ?? plan.vendors[idx].notes,
          followUpDate: data.followUpDate || plan.vendors[idx].followUpDate,
          questionsToAsk: data.questionsToAsk ?? plan.vendors[idx].questionsToAsk,
        };
      } else {
        const newVendor: Vendor = {
          id: data.id,
          eventId: id,
          category: data.category,
          businessName: data.businessName,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email || undefined,
          estimatedQuote: data.estimatedQuote,
          finalQuote: data.finalQuote,
          status: data.status,
          paymentNotes: data.paymentNotes,
          notes: data.notes,
          followUpDate: data.followUpDate || undefined,
          questionsToAsk: data.questionsToAsk,
        };
        plan.vendors.push(newVendor);
      }
    }

    saveEventPlan(plan);
    return NextResponse.json({ success: true, vendors: plan.vendors });
  } catch (err: unknown) {
    console.error("Failed to save vendor:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/vendors
 * Deletes a vendor by ID with strict runtime Zod validation.
 *
 * @param req - Incoming NextRequest containing vendorId in JSON body
 * @param context - Route context containing URL params
 * @returns JSON response with updated vendors array or error details
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

    const validated = deleteVendorSchema.safeParse(body);
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

    plan.vendors = plan.vendors.filter((v) => v.id !== validated.data.vendorId);
    saveEventPlan(plan);

    return NextResponse.json({ success: true, vendors: plan.vendors });
  } catch (err: unknown) {
    console.error("Failed to delete vendor:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]/vendors
 * Partially updates an existing vendor (e.g. quotes, status, notes).
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

    const targetId = (body.id || body.vendorId) as string | undefined;
    if (!targetId || typeof targetId !== "string") {
      return NextResponse.json(
        { success: false, error: "vendorId or id is required for PATCH update" },
        { status: 400 }
      );
    }

    const vendorIndex = plan.vendors.findIndex((v) => v.id === targetId);
    if (vendorIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    const existing = plan.vendors[vendorIndex];
    plan.vendors[vendorIndex] = {
      ...existing,
      ...(typeof body.businessName === "string" ? { businessName: body.businessName } : {}),
      ...(typeof body.category === "string" ? { category: body.category } : {}),
      ...(typeof body.contactPerson === "string" ? { contactPerson: body.contactPerson } : {}),
      ...(typeof body.phone === "string" ? { phone: body.phone } : {}),
      ...(typeof body.email === "string" ? { email: body.email } : {}),
      ...(typeof body.estimatedQuote === "number" ? { estimatedQuote: body.estimatedQuote } : {}),
      ...(typeof body.finalQuote === "number" ? { finalQuote: body.finalQuote } : {}),
      ...(typeof body.status === "string" && ["not_contacted", "contacted", "quote_received", "booked", "not_proceeding"].includes(body.status)
        ? { status: body.status as "not_contacted" | "contacted" | "quote_received" | "booked" | "not_proceeding" }
        : {}),
      ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
      ...(typeof body.paymentNotes === "string" ? { paymentNotes: body.paymentNotes } : {}),
    };

    saveEventPlan(plan);
    return NextResponse.json({ success: true, vendors: plan.vendors });
  } catch (err: unknown) {
    console.error("Failed to patch vendor:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}
