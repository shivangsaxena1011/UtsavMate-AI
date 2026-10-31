import { NextRequest, NextResponse } from "next/server";
import { CreateEventInputSchema } from "@/lib/types";
import { createNewEvent, listEvents } from "@/lib/storage";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
