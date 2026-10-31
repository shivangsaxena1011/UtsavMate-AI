import fs from "fs";
import path from "path";
import { CreateEventInput, FullEventPlan } from "./types";
import { generateInitialBudget } from "./engines/budget";
import { generateTimelineTasks } from "./engines/timeline";
import { generateInitialVendors } from "./engines/vendors";
import { generateEventPlan } from "./ai";

// Support both serverless (/tmp writable on Vercel/Lambda) and local environments
const BASE_DATA_PATH = process.env.VERCEL
  ? path.join("/tmp", "utsavmate-data")
  : path.join(process.cwd(), "data");

const DATA_DIR = BASE_DATA_PATH;
const EVENTS_DIR = path.join(DATA_DIR, "events");

// In-memory resilient cache across hot serverless requests
const memoryStore: Map<string, FullEventPlan> =
  (globalThis as unknown as { __utsavmate_events?: Map<string, FullEventPlan> }).__utsavmate_events ||
  new Map<string, FullEventPlan>();

(globalThis as unknown as { __utsavmate_events?: Map<string, FullEventPlan> }).__utsavmate_events = memoryStore;

// Ensure data directory exists
function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EVENTS_DIR)) {
      fs.mkdirSync(EVENTS_DIR, { recursive: true });
    }
  } catch {
    // Non-fatal if filesystem is restricted; memoryStore acts as fallback
  }
}

/**
 * Atomic write helper with in-memory resilient fallback.
 */
function atomicWriteJson(filePath: string, data: unknown) {
  try {
    ensureDirs();
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch {
    // Filesystem write failed; data is preserved in memoryStore
  }
}

export function listEvents(userId?: string): FullEventPlan["event"][] {
  ensureDirs();
  const eventMap = new Map<string, FullEventPlan["event"]>();

  // 1. Read from disk if available
  try {
    if (fs.existsSync(EVENTS_DIR)) {
      const files = fs.readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(EVENTS_DIR, file), "utf-8");
          const plan: FullEventPlan = JSON.parse(content);
          if (!userId || plan.event.userId === userId || plan.event.userId === "default-user") {
            eventMap.set(plan.event.id, plan.event);
          }
        } catch {
          // Ignore corrupt files
        }
      }
    }
  } catch {
    // Disk read failed; proceed to memory
  }

  // 2. Overlay in-memory cache
  for (const plan of memoryStore.values()) {
    if (!userId || plan.event.userId === userId || plan.event.userId === "default-user") {
      eventMap.set(plan.event.id, plan.event);
    }
  }

  return Array.from(eventMap.values()).sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );
}

export function getEventPlan(eventId: string): FullEventPlan | null {
  // Check memory first
  if (memoryStore.has(eventId)) {
    return memoryStore.get(eventId)!;
  }

  ensureDirs();
  const filePath = path.join(EVENTS_DIR, `${eventId}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const plan = JSON.parse(content) as FullEventPlan;
      memoryStore.set(eventId, plan);
      return plan;
    }
  } catch (err) {
    console.error("Error reading plan from disk:", err);
  }

  return null;
}

export function saveEventPlan(plan: FullEventPlan): void {
  plan.event.updatedAt = new Date().toISOString();
  memoryStore.set(plan.event.id, plan);

  ensureDirs();
  const filePath = path.join(EVENTS_DIR, `${plan.event.id}.json`);
  atomicWriteJson(filePath, plan);
}

export async function createNewEvent(
  input: CreateEventInput,
  userId: string = "default-user"
): Promise<FullEventPlan> {
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
  memoryStore.delete(eventId);
  try {
    ensureDirs();
    const filePath = path.join(EVENTS_DIR, `${eventId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch {
    // Filesystem deletion failed, but memoryStore cleared
  }
  return true;
}
