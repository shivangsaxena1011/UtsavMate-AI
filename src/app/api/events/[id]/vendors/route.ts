import { NextRequest, NextResponse } from "next/server";
import { getEventPlan, saveEventPlan } from "@/lib/storage";
import { Vendor } from "@/lib/types";

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

    const vendor: Vendor = await req.json();

    if (!vendor.id) {
      vendor.id = `vnd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      vendor.eventId = id;
      plan.vendors.push(vendor);
    } else {
      const idx = plan.vendors.findIndex((v) => v.id === vendor.id);
      if (idx >= 0) {
        plan.vendors[idx] = { ...plan.vendors[idx], ...vendor };
      } else {
        plan.vendors.push(vendor);
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

    const { vendorId } = await req.json();
    plan.vendors = plan.vendors.filter((v) => v.id !== vendorId);
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
