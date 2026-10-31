import fs from "fs";
import path from "path";
import { CreateEventInput, FullEventPlan, BudgetItem, TimelineTask, Vendor } from "./types";
import { generateInitialBudget } from "./engines/budget";
import { generateTimelineTasks } from "./engines/timeline";
import { generateInitialVendors } from "./engines/vendors";
import { generateEventPlan } from "./ai";

const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_DIR = path.join(DATA_DIR, "events");

// Ensure data directory exists
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

/**
 * Atomic write helper to prevent partial writes during crashes.
 */
function atomicWriteJson(filePath: string, data: unknown) {
  ensureDirs();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
}



export function listEvents(userId?: string): FullEventPlan["event"][] {
  ensureDirs();
  const files = fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".json"));
  const events: FullEventPlan["event"][] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
      const plan: FullEventPlan = JSON.parse(content);
      if (!userId || plan.event.userId === userId || plan.event.userId === "default-user") {
        events.push(plan.event);
      }
    } catch {
      // Ignore corrupt files
    }
  }

  return events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
}

export function getEventPlan(eventId: string): FullEventPlan | null {
  ensureDirs();
  const filePath = path.join(EVENTS_DIR, `${eventId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as FullEventPlan;
  } catch (err) {
    console.error("Error reading plan:", err);
    return null;
  }
}

export function saveEventPlan(plan: FullEventPlan): void {
  ensureDirs();
  const filePath = path.join(EVENTS_DIR, `${plan.event.id}.json`);
  plan.event.updatedAt = new Date().toISOString();
  atomicWriteJson(filePath, plan);
}

export async function createNewEvent(
  input: CreateEventInput,
  userId: string = "default-user"
): Promise<FullEventPlan> {
  ensureDirs();
  const eventId = `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const eventRecord: FullEventPlan["event"] = {
    id: eventId,
    userId,
    title: input.title,
    eventType: input.eventType,
    eventDate: input.eventDate,
    eventTime: input.eventTime,
    city: input.city,
    guestCount: input.guestCount,
    totalBudget: input.totalBudget,
    currency: "INR",
    theme: input.theme,
    style: input.style,
    dietaryPreferences: input.dietaryPreferences,
    accessibilityNeeds: input.accessibilityNeeds,
    culturalPreferences: input.culturalPreferences,
    notes: input.notes,
    language: input.language,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Generate deterministic base items
  const budget = generateInitialBudget(input.eventType, input.totalBudget, eventId);
  const tasks = generateTimelineTasks(input.eventType, input.eventDate, eventId);
  const vendors = generateInitialVendors(input.eventType, input.totalBudget, eventId);

  // Generate AI or Fallback Plan
  const aiResult = await generateEventPlan(eventRecord);

  const personalizedIdeas = (aiResult.plan.personalizedIdeas || []).map((idea, idx) => ({
    id: `idea-${idx}-${Date.now().toString(36)}`,
    eventId,
    section: idea.section,
    title: idea.title,
    description: idea.description,
    costTier: idea.costTier,
    tags: idea.tags,
  }));

  const fullPlan: FullEventPlan = {
    event: eventRecord,
    budget,
    tasks,
    vendors,
    ideas: personalizedIdeas,
    aiGenerated: aiResult.source === "gemini",
    aiProvider: aiResult.source,
    version: 1,
  };

  saveEventPlan(fullPlan);
  return fullPlan;
}

export function deleteEvent(eventId: string): boolean {
  ensureDirs();
  const filePath = path.join(EVENTS_DIR, `${eventId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
