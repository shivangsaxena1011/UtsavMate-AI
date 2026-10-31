/**
 * @file types.ts
 * @module lib/types
 * @description Core domain TypeScript interfaces, Zod validation schemas, and enum definitions
 * for the UtsavMate-AI event planning platform. Defines schemas for events, budget ledger,
 * timeline roadmap, vendor coordination, and personalized ideas.
 */

import { z } from "zod";

/**
 * Supported celebration event types.
 */
export const EVENT_TYPES = [
  "wedding",
  "birthday",
  "anniversary",
  "college_fest",
  "community",
  "custom",
] as const;

/**
 * Union type representing supported celebration categories.
 */
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Zod schema for validating event types with backward-compatible preprocessing.
 */
export const EventTypeEnum = z.preprocess(
  (val: unknown) => (val === "college_event" ? "college_fest" : val),
  z.enum(EVENT_TYPES)
);

/**
 * Standard budget allocation categories for Indian events.
 */
export const BudgetCategoryEnum = z.enum([
  "venue",
  "catering",
  "decor",
  "photography",
  "entertainment",
  "invitations",
  "attire",
  "transport",
  "contingency",
  "other",
]);

/**
 * Type representing budget categorization keys.
 */
export type BudgetCategory = z.infer<typeof BudgetCategoryEnum>;

/**
 * Priority classification for timeline milestone tasks.
 */
export const TaskPriorityEnum = z.enum(["high", "medium", "low"]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

/**
 * Execution status for timeline tasks.
 */
export const TaskStatusEnum = z.enum(["pending", "in_progress", "completed"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

/**
 * Outreach and negotiation status for vendor coordination.
 */
export const VendorStatusEnum = z.enum([
  "not_contacted",
  "contacted",
  "quote_received",
  "booked",
  "not_proceeding",
]);
export type VendorStatus = z.infer<typeof VendorStatusEnum>;

/**
 * Supported UI and AI prompt response languages.
 */
export const LANGUAGES = ["en", "hi", "hinglish"] as const;
export type Language = (typeof LANGUAGES)[number];

/**
 * Zod schema for language codes with backward-compatible preprocessing.
 */
export const LanguageEnum = z.preprocess(
  (val: unknown) => (val === "english" ? "en" : val === "hindi" ? "hi" : val),
  z.enum(LANGUAGES)
);

/**
 * Core event record metadata stored in persistence.
 */
export interface EventRecord {
  /** Unique event identifier (e.g. "event-m1234-xyz") */
  id: string;
  /** Owning user identifier or "default-user" */
  userId: string;
  /** Title of the celebration */
  title: string;
  /** Category of celebration */
  eventType: EventType;
  /** Scheduled date in YYYY-MM-DD format */
  eventDate: string;
  /** Optional time string (e.g. "18:00") */
  eventTime?: string;
  /** Primary host city (e.g. "Jaipur", "Delhi") */
  city: string;
  /** Expected guest headcount */
  guestCount: number;
  /** Overall allocated budget in Indian Rupees (INR) */
  totalBudget: number;
  /** ISO currency code (always "INR") */
  currency: string;
  /** Optional decorative theme (e.g. "Royal Rajputana", "Neon Retro") */
  theme?: string;
  /** Optional stylistic preference */
  style?: string;
  /** Dietary instructions (e.g. "Pure Veg, Jain food counter") */
  dietaryPreferences?: string;
  /** Wheelchair, ramp, or elevator requirements */
  accessibilityNeeds?: string;
  /** Cultural traditions and rituals */
  culturalPreferences?: string;
  /** Freeform organizer notes */
  notes?: string;
  /** Preferred output language */
  language: Language;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last modified timestamp */
  updatedAt: string;
}

/**
 * Zod schema validating an EventRecord structure.
 */
export const EventRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  eventType: EventTypeEnum,
  eventDate: z.string(),
  eventTime: z.string().optional(),
  city: z.string(),
  guestCount: z.number(),
  totalBudget: z.number(),
  currency: z.string(),
  theme: z.string().optional(),
  style: z.string().optional(),
  dietaryPreferences: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  culturalPreferences: z.string().optional(),
  notes: z.string().optional(),
  language: LanguageEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Individual expense line item within an event's budget.
 */
export interface BudgetItem {
  /** Unique line item identifier */
  id: string;
  /** Foreign key pointing to parent EventRecord */
  eventId: string;
  /** Budget category this item belongs to */
  category: BudgetCategory;
  /** Descriptive name of expense (e.g. "Main Banquet Lawn") */
  name: string;
  /** Projected cost in INR */
  estimatedAmount: number;
  /** Realized cost in INR */
  actualAmount: number;
  /** Additional contractor terms or payment notes */
  notes?: string;
  /** Payment lifecycle state */
  status?: "planned" | "booked" | "paid";
}

/**
 * Zod schema validating a BudgetItem structure.
 */
export const BudgetItemSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  category: BudgetCategoryEnum,
  name: z.string(),
  estimatedAmount: z.number(),
  actualAmount: z.number(),
  notes: z.string().optional(),
  status: z.enum(["planned", "booked", "paid"]).optional(),
});

/**
 * Date-anchored milestone task on the planning roadmap.
 */
export interface TimelineTask {
  /** Unique task identifier */
  id: string;
  /** Foreign key to EventRecord */
  eventId: string;
  /** Actionable task headline */
  title: string;
  /** Detailed step-by-step guidance */
  description: string;
  /** Functional category (e.g. "Catering", "Logistics") */
  category: string;
  /** Target completion date in YYYY-MM-DD format */
  dueDate: string;
  /** Urgency level */
  priority: TaskPriority;
  /** Completion state */
  status: TaskStatus;
  /** Optional task notes */
  notes?: string;
  /** Flag computed dynamically if dueDate is past current date */
  isOverdue?: boolean;
}

/**
 * Zod schema validating a TimelineTask structure.
 */
export const TimelineTaskSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  dueDate: z.string(),
  priority: TaskPriorityEnum,
  status: TaskStatusEnum,
  notes: z.string().optional(),
  isOverdue: z.boolean().optional(),
});

/**
 * Commercial contractor / supplier tracked for the event.
 */
export interface Vendor {
  /** Unique vendor record identifier */
  id: string;
  /** Foreign key to EventRecord */
  eventId: string;
  /** Commercial service category */
  category: string;
  /** Name of vendor business or professional */
  businessName: string;
  /** Primary contact representative name */
  contactPerson?: string;
  /** Telephone or WhatsApp contact number */
  phone?: string;
  /** Email address */
  email?: string;
  /** Initial estimated quote in INR */
  estimatedQuote: number;
  /** Negotiated final contract quote in INR */
  finalQuote: number;
  /** Procurement pipeline status */
  status: VendorStatus;
  /** Milestone payment schedule notes */
  paymentNotes?: string;
  /** General vendor notes */
  notes?: string;
  /** Date for next scheduled phone call or tasting */
  followUpDate?: string;
  /** Culturally relevant vetting checklist questions */
  questionsToAsk?: string[];
}

/**
 * Zod schema validating a Vendor structure.
 */
export const VendorSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  category: z.string(),
  businessName: z.string(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  estimatedQuote: z.number(),
  finalQuote: z.number(),
  status: VendorStatusEnum,
  paymentNotes: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  questionsToAsk: z.array(z.string()).optional(),
});

/**
 * AI-generated or curated thematic inspiration card.
 */
export interface PersonalizedIdea {
  /** Unique idea identifier */
  id: string;
  /** Foreign key to EventRecord */
  eventId: string;
  /** Event aspect this idea relates to */
  section: "theme" | "decor" | "food" | "activity" | "favor" | "saving";
  /** Evocative idea headline */
  title: string;
  /** Comprehensive implementation description */
  description: string;
  /** Relative expense tier ("$" = frugal/DIY, "$$$" = premium luxury) */
  costTier: "$" | "$$" | "$$$";
  /** Discoverability tags */
  tags?: string[];
}

/**
 * Zod schema validating a PersonalizedIdea structure.
 */
export const PersonalizedIdeaSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  section: z.enum(["theme", "decor", "food", "activity", "favor", "saving"]),
  title: z.string(),
  description: z.string(),
  costTier: z.enum(["$", "$$", "$$$"]),
  tags: z.array(z.string()).optional(),
});

/**
 * Aggregate root containing complete event state and child entities.
 */
export interface FullEventPlan {
  /** Master event record */
  event: EventRecord;
  /** Line item budget ledger */
  budget: BudgetItem[];
  /** Timeline milestones */
  tasks: TimelineTask[];
  /** Vendor contacts and quotation sheet */
  vendors: Vendor[];
  /** Curated personalized ideas and tips */
  ideas: PersonalizedIdea[];
  /** True if ideas were generated live via LLM API */
  aiGenerated: boolean;
  /** Originating generation engine */
  aiProvider: "gemini" | "claude" | "deterministic_fallback";
  /** Schema version number for migrations */
  version: number;
}

/**
 * Zod schema validating a FullEventPlan structure.
 */
export const FullEventPlanSchema = z.object({
  event: EventRecordSchema,
  budget: z.array(BudgetItemSchema),
  tasks: z.array(TimelineTaskSchema),
  vendors: z.array(VendorSchema),
  ideas: z.array(PersonalizedIdeaSchema),
  aiGenerated: z.boolean(),
  aiProvider: z.enum(["gemini", "claude", "deterministic_fallback"]),
  version: z.number(),
});

/**
 * Deterministically computed financial summary metrics.
 */
export interface BudgetSummary {
  /** Target budget cap in INR */
  totalBudget: number;
  /** Sum of all estimated budget items */
  totalEstimated: number;
  /** Sum of all actual expenses recorded */
  totalActual: number;
  /** Unallocated buffer from estimated total */
  remainingFromEstimated: number;
  /** Unallocated buffer from actual expenses */
  remainingFromActual: number;
  /** Percentage of target budget utilized (0-100+) */
  utilizationPercentage: number;
  /** True if estimated or actual amounts exceed totalBudget or category limits */
  isOverspent: boolean;
  /** Total quantum of deficit in INR */
  overspentAmount: number;
  /** Average projected cost per attendee */
  costPerGuestEstimated: number;
  /** Average actual cost per attendee */
  costPerGuestActual: number;
  /** Detailed breakdown per BudgetCategory */
  categoryBreakdown: Record<
    BudgetCategory,
    {
      category: BudgetCategory;
      label: string;
      estimated: number;
      actual: number;
      variance: number;
      percentageOfBudget: number;
      isOverspent: boolean;
    }
  >;
  /** High-priority actionable financial warnings */
  warnings: string[];
}

/**
 * Runtime Zod schema validating incoming payloads for new event creation.
 */
export const CreateEventInputSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100),
  eventType: EventTypeEnum,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  eventTime: z.string().optional(),
  city: z.string().min(2, "City name is required").max(100),
  guestCount: z.number().int().min(1, "Guest count must be at least 1").max(50000),
  totalBudget: z.number().min(0, "Budget cannot be negative").max(100000000),
  theme: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  dietaryPreferences: z.string().max(200).optional(),
  accessibilityNeeds: z.string().max(200).optional(),
  culturalPreferences: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  language: LanguageEnum.default("en"),
});

export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;
