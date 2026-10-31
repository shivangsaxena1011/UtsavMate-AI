/**
 * @file api.ts
 * @summary Production-ready Zod validation schemas and type contracts for all UtsavMate-AI mutation routes.
 * @description Provides strict input validation, normalization transforms, and standard error formatting
 * for budget, tasks, vendors, event updates, and AI refinement endpoints.
 */

import { z } from "zod";
import { BudgetCategory, BudgetCategoryEnum } from "../types";

/**
 * Valid event lifecycle status enumeration.
 */
export const EventStatusEnum = z.enum([
  "draft",
  "planning",
  "confirmed",
  "completed",
  "cancelled",
]);
export type EventStatus = z.infer<typeof EventStatusEnum>;

/**
 * Valid budget item status enumeration.
 */
export const BudgetItemStatusEnum = z.enum(["planned", "booked", "paid"]);
export type BudgetItemStatus = z.infer<typeof BudgetItemStatusEnum>;

/**
 * Valid task priority enumeration.
 */
export const TaskPriorityEnum = z.enum(["high", "medium", "low"]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

/**
 * Valid task status enumeration.
 */
export const TaskStatusEnum = z.enum(["pending", "in_progress", "completed"]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

/**
 * Valid vendor status enumeration.
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
 * Schema for route parameter validation ensuring valid event identifier.
 */
export const eventIdParamSchema = z.object({
  id: z.string().trim().min(1, "Event ID is required"),
});
export type EventIdParam = z.infer<typeof eventIdParamSchema>;

/**
 * Production-ready Zod schema for adding or updating a budget item.
 * Supports standard { category, item, estimatedCost } fields while
 * maintaining dual backwards-compatibility with { name, estimatedAmount }.
 */
export const addBudgetItemSchema = z
  .object({
    id: z.string().trim().optional(),
    eventId: z.string().trim().optional(),
    category: BudgetCategoryEnum,
    item: z.string().trim().min(1, "Item name is required").optional(),
    name: z.string().trim().min(1, "Item name is required").optional(),
    estimatedCost: z.number().min(0, "Estimated cost cannot be negative").optional(),
    estimatedAmount: z.number().min(0, "Estimated amount cannot be negative").optional(),
    actualAmount: z.number().min(0, "Actual amount cannot be negative").optional().default(0),
    status: BudgetItemStatusEnum.optional().default("planned"),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  })
  .refine(
    (data) =>
      (data.item !== undefined && data.item.length > 0) ||
      (data.name !== undefined && data.name.length > 0),
    {
      message: "Item name is required (provide either 'item' or 'name')",
      path: ["item"],
    }
  )
  .refine(
    (data) => data.estimatedCost !== undefined || data.estimatedAmount !== undefined,
    {
      message: "Estimated cost is required (provide either 'estimatedCost' or 'estimatedAmount')",
      path: ["estimatedCost"],
    }
  )
  .transform((data) => {
    const resolvedName = data.item ?? data.name ?? "";
    const resolvedCost = data.estimatedCost ?? data.estimatedAmount ?? 0;
    return {
      ...data,
      item: resolvedName,
      name: resolvedName,
      estimatedCost: resolvedCost,
      estimatedAmount: resolvedCost,
    };
  });
export type AddBudgetItemInput = z.infer<typeof addBudgetItemSchema>;

/**
 * Schema for deleting a budget item by ID.
 */
export const deleteBudgetItemSchema = z.object({
  itemId: z.string().trim().min(1, "Item ID is required"),
});
export type DeleteBudgetItemInput = z.infer<typeof deleteBudgetItemSchema>;

/**
 * Production-ready Zod schema for adding or updating a timeline task.
 * Enforces { title, category, dueDate } format with ISO YYYY-MM-DD validation.
 */
export const addTaskSchema = z.object({
  id: z.string().trim().optional(),
  eventId: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(200, "Title cannot exceed 200 characters"),
  category: z.string().trim().min(1, "Category is required").default("General"),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format"),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .default(""),
  priority: TaskPriorityEnum.optional().default("medium"),
  status: TaskStatusEnum.optional().default("pending"),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  isOverdue: z.boolean().optional().default(false),
});
export type AddTaskInput = z.infer<typeof addTaskSchema>;

/**
 * Schema for deleting a timeline task by ID.
 */
export const deleteTaskSchema = z.object({
  taskId: z.string().trim().min(1, "Task ID is required"),
});
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

/**
 * Production-ready Zod schema for adding or updating a vendor.
 * Supports { name, category, contact } alongside full vendor details
 * ({ businessName, contactPerson, estimatedQuote, finalQuote, status }).
 */
export const addVendorSchema = z
  .object({
    id: z.string().trim().optional(),
    eventId: z.string().trim().optional(),
    name: z.string().trim().min(1, "Vendor name is required").optional(),
    businessName: z.string().trim().min(1, "Business name is required").optional(),
    category: z.string().trim().min(1, "Category is required"),
    contact: z.string().trim().max(100, "Contact cannot exceed 100 characters").optional(),
    contactPerson: z
      .string()
      .trim()
      .max(100, "Contact person cannot exceed 100 characters")
      .optional(),
    phone: z.string().trim().max(20, "Phone cannot exceed 20 characters").optional(),
    email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
    estimatedQuote: z
      .number()
      .min(0, "Estimated quote cannot be negative")
      .optional()
      .default(0),
    finalQuote: z
      .number()
      .min(0, "Final quote cannot be negative")
      .optional()
      .default(0),
    status: VendorStatusEnum.optional().default("not_contacted"),
    paymentNotes: z.string().max(500, "Payment notes cannot exceed 500 characters").optional(),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
    followUpDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Follow-up date must be YYYY-MM-DD")
      .optional()
      .or(z.literal("")),
    questionsToAsk: z.array(z.string().trim()).optional(),
  })
  .refine(
    (data) =>
      (data.name !== undefined && data.name.length > 0) ||
      (data.businessName !== undefined && data.businessName.length > 0),
    {
      message: "Vendor name is required (provide either 'name' or 'businessName')",
      path: ["name"],
    }
  )
  .transform((data) => {
    const resolvedName = data.name ?? data.businessName ?? "";
    const resolvedContact = data.contactPerson ?? data.contact;
    return {
      ...data,
      name: resolvedName,
      businessName: resolvedName,
      contact: resolvedContact,
      contactPerson: resolvedContact,
    };
  });
export type AddVendorInput = z.infer<typeof addVendorSchema>;

/**
 * Schema for deleting a vendor by ID.
 */
export const deleteVendorSchema = z.object({
  vendorId: z.string().trim().min(1, "Vendor ID is required"),
});
export type DeleteVendorInput = z.infer<typeof deleteVendorSchema>;

/**
 * Production-ready Zod schema for patching event properties.
 * Validates updates to notes and status, as well as core event attributes.
 */
export const patchEventSchema = z
  .object({
    notes: z.string().max(2000, "Notes cannot exceed 2000 characters").optional(),
    status: EventStatusEnum.optional(),
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(100, "Title cannot exceed 100 characters")
      .optional(),
    eventDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .optional(),
    eventTime: z.string().trim().max(50).optional(),
    city: z.string().trim().min(2, "City must be at least 2 characters").max(100).optional(),
    guestCount: z
      .number()
      .int()
      .min(1, "Guest count must be at least 1")
      .max(50000)
      .optional(),
    totalBudget: z.number().min(0, "Budget cannot be negative").max(100000000).optional(),
    theme: z.string().trim().max(100).optional(),
    style: z.string().trim().max(100).optional(),
    dietaryPreferences: z.string().trim().max(200).optional(),
    accessibilityNeeds: z.string().trim().max(200).optional(),
    culturalPreferences: z.string().trim().max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the event",
  });
export type PatchEventInput = z.infer<typeof patchEventSchema>;

/**
 * Production-ready Zod schema for AI refine request payload.
 * Validates prompt presence, length, and boolean applyAction flag.
 */
export const refineRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt string is required")
    .max(1000, "Prompt cannot exceed 1000 characters"),
  applyAction: z.boolean().optional().default(false),
});
export type RefineRequestInput = z.infer<typeof refineRequestSchema>;

/**
 * Formats a ZodError into a standard Record<string, string[]> for HTTP 400 responses.
 * @param error - ZodError instance
 * @returns Formatted field error record
 */
export function formatZodError(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_errors";
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(issue.message);
  }
  return result;
}

export type { BudgetCategory };
