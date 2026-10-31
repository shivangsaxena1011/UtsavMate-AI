/**
 * @file storage.ts
 * @module lib/storage
 * @description Resilient persistence layer supporting in-memory caching and filesystem JSON storage
 * with atomic write guarantees for serverless and containerized deployments.
 * Implements structured diagnostic logging, schema validation on deserialization,
 * and orphaned temporary file cleanup.
 */

import fs from "fs";
import path from "path";
import { CreateEventInput, FullEventPlan, FullEventPlanSchema } from "./types";
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

// Type-safe declaration merging on globalThis to survive Next.js HMR cycles and warm serverless containers
declare global {
  var __utsavmate_events: Map<string, FullEventPlan> | undefined;
}

// In-memory resilient cache across hot serverless requests
const memoryStore: Map<string, FullEventPlan> =
  globalThis.__utsavmate_events ?? new Map<string, FullEventPlan>();

globalThis.__utsavmate_events = memoryStore;

/**
 * Ensures data directory hierarchy exists on the filesystem.
 * Handles read-only or restricted serverless environments gracefully with structured logging.
 *
 * @internal
 */
function ensureDirs(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(EVENTS_DIR)) {
      fs.mkdirSync(EVENTS_DIR, { recursive: true });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[Storage:ensureDirs] Filesystem directory creation failed at "${DATA_DIR}". Operating with in-memory fallback:`,
      message
    );
  }
}

/**
 * Atomically writes data to disk using temporary file creation and atomic rename,
 * preventing corruption from concurrent writes or interrupted serverless execution.
 * Cleans up orphaned temporary files upon failure.
 *
 * @param filePath - Target absolute destination file path
 * @param data - Serializable JSON data object
 */
function atomicWriteJson(filePath: string, data: unknown): void {
  let tempPath: string | null = null;
  try {
    ensureDirs();
    tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[Storage:atomicWriteJson] Failed writing to "${filePath}". Data is preserved in memoryStore:`,
      message
    );
    if (tempPath) {
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupErr: unknown) {
        console.warn(
          `[Storage:atomicWriteJson] Failed to clean up orphaned temp file "${tempPath}":`,
          cleanupErr instanceof Error ? cleanupErr.message : cleanupErr
        );
      }
    }
  }
}

/**
 * Retrieves all saved event summary records sorted chronologically by event date.
 * Queries local filesystem with memory cache fallback and skips corrupt files.
 *
 * @param userId - Optional user ID filter (defaults to returning all matching events)
 * @returns Array of EventRecord summaries sorted ascending by eventDate
 *
 * @example
 * ```ts
 * const events = listEvents("default-user");
 * console.log(`Loaded ${events.length} events`);
 * ```
 */
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
          const parsedJson: unknown = JSON.parse(content);
          const validated = FullEventPlanSchema.safeParse(parsedJson);
          if (validated.success) {
            const plan = validated.data;
            if (!userId || plan.event.userId === userId || plan.event.userId === "default-user") {
              eventMap.set(plan.event.id, plan.event);
            }
          } else {
            console.warn(
              `[Storage:listEvents] Skipped corrupt or invalid event file "${file}":`,
              validated.error.format()
            );
          }
        } catch (err: unknown) {
          console.warn(
            `[Storage:listEvents] Skipped corrupt or unreadable event file "${file}":`,
            err instanceof Error ? err.message : err
          );
        }
      }
    }
  } catch (err: unknown) {
    console.warn(
      "[Storage:listEvents] Failed reading events directory from disk; serving from in-memory cache:",
      err instanceof Error ? err.message : err
    );
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

/**
 * Retrieves a complete event plan by its unique event ID.
 * Checks hot memory cache first before reading and validating from disk.
 *
 * @param eventId - The unique event identifier (e.g. "event-k9z2-841a")
 * @returns FullEventPlan object if found and valid; null otherwise
 */
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
      const parsedJson: unknown = JSON.parse(content);
      const validated = FullEventPlanSchema.safeParse(parsedJson);
      if (validated.success) {
        memoryStore.set(eventId, validated.data);
        return validated.data;
      } else {
        console.warn(
          `[Storage:getEventPlan] Schema validation failed for event "${eventId}":`,
          validated.error.format()
        );
        return null;
      }
    }
  } catch (err: unknown) {
    console.warn(
      `[Storage:getEventPlan] Error reading event plan from disk for "${eventId}":`,
      err instanceof Error ? err.message : err
    );
  }

  return null;
}

/**
 * Persists an event plan to memory cache and writes atomically to disk.
 * Automatically stamps updatedAt with current ISO 8601 timestamp.
 *
 * @param plan - The FullEventPlan object to store
 */
export function saveEventPlan(plan: FullEventPlan): void {
  plan.event.updatedAt = new Date().toISOString();
  memoryStore.set(plan.event.id, plan);

  ensureDirs();
  const filePath = path.join(EVENTS_DIR, `${plan.event.id}.json`);
  atomicWriteJson(filePath, plan);
}

/**
 * Initializes a new event plan by synthesizing deterministic base budgets, timeline milestones,
 * vendor templates, and AI-generated personalized ideas.
 *
 * @param input - Validated new event form input data
 * @param userId - Owner identifier (defaults to "default-user")
 * @returns Promise resolving to the newly created and saved FullEventPlan
 */
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

/**
 * Deletes an event from memory cache and removes its backing JSON file from disk.
 *
 * @param eventId - Unique event identifier to delete
 * @returns True if deletion completed in memory or on disk
 */
export function deleteEvent(eventId: string): boolean {
  const memoryExisted = memoryStore.delete(eventId);
  let diskDeleted = false;

  try {
    ensureDirs();
    const filePath = path.join(EVENTS_DIR, `${eventId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      diskDeleted = true;
    }
  } catch (err: unknown) {
    console.warn(
      `[Storage:deleteEvent] Filesystem deletion failed for event "${eventId}":`,
      err instanceof Error ? err.message : err
    );
  }

  return memoryExisted || diskDeleted;
}
