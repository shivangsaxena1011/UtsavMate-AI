import { z } from "zod";

export const EventTypeEnum = z.enum([
  "wedding",
  "birthday",
  "anniversary",
  "college_fest",
  "community",
  "custom",
]);
export type EventType = z.infer<typeof EventTypeEnum>;

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
export type BudgetCategory = z.infer<typeof BudgetCategoryEnum>;

export const TaskPriorityEnum = z.enum(["high", "medium", "low"]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskStatusEnum = z.enum(["pending", "in_progress", "completed"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const VendorStatusEnum = z.enum([
  "not_contacted",
  "contacted",
  "quote_received",
  "booked",
  "not_proceeding",
]);
export type VendorStatus = z.infer<typeof VendorStatusEnum>;

export const LanguageEnum = z.enum(["en", "hi", "hinglish"]);
export type Language = z.infer<typeof LanguageEnum>;

export interface EventRecord {
  id: string;
  userId: string;
  title: string;
  eventType: EventType;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string;
  city: string;
  guestCount: number;
  totalBudget: number; // in INR
  currency: string;
  theme?: string;
  style?: string;
  dietaryPreferences?: string;
  accessibilityNeeds?: string;
  culturalPreferences?: string;
  notes?: string;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  eventId: string;
  category: BudgetCategory;
  name: string;
  estimatedAmount: number;
  actualAmount: number;
  notes?: string;
  status?: "planned" | "booked" | "paid";
}

export interface TimelineTask {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  isOverdue?: boolean;
}

export interface Vendor {
  id: string;
  eventId: string;
  category: string;
  businessName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  estimatedQuote: number;
  finalQuote: number;
  status: VendorStatus;
  paymentNotes?: string;
  notes?: string;
  followUpDate?: string;
  questionsToAsk?: string[];
}

export interface PersonalizedIdea {
  id: string;
  eventId: string;
  section: "theme" | "decor" | "food" | "activity" | "favor" | "saving";
  title: string;
  description: string;
  costTier: "$" | "$$" | "$$$";
  tags?: string[];
}

export interface FullEventPlan {
  event: EventRecord;
  budget: BudgetItem[];
  tasks: TimelineTask[];
  vendors: Vendor[];
  ideas: PersonalizedIdea[];
  aiGenerated: boolean;
  aiProvider: "gemini" | "claude" | "deterministic_fallback";
  version: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  remainingFromEstimated: number;
  remainingFromActual: number;
  utilizationPercentage: number;
  isOverspent: boolean;
  overspentAmount: number;
  costPerGuestEstimated: number;
  costPerGuestActual: number;
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
  warnings: string[];
}

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
