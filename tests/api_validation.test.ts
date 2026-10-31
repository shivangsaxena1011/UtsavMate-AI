import { describe, it, expect } from "vitest";
import {
  eventIdParamSchema,
  addBudgetItemSchema,
  deleteBudgetItemSchema,
  addTaskSchema,
  deleteTaskSchema,
  addVendorSchema,
  deleteVendorSchema,
  patchEventSchema,
  refineRequestSchema,
  formatZodError,
} from "../src/lib/validation/api";

describe("API Zod Validation Schemas", () => {
  describe("eventIdParamSchema", () => {
    it("accepts valid non-empty IDs and trims whitespace", () => {
      const res = eventIdParamSchema.safeParse({ id: "  event-123  " });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.id).toBe("event-123");
      }
    });

    it("rejects empty or whitespace-only event IDs", () => {
      expect(eventIdParamSchema.safeParse({ id: "" }).success).toBe(false);
      expect(eventIdParamSchema.safeParse({ id: "   " }).success).toBe(false);
      expect(eventIdParamSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("addBudgetItemSchema", () => {
    it("accepts canonical schema with { category, item, estimatedCost }", () => {
      const payload = {
        category: "decor",
        item: "Stage Floral Arch",
        estimatedCost: 25000,
      };
      const res = addBudgetItemSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toBe("Stage Floral Arch");
        expect(res.data.item).toBe("Stage Floral Arch");
        expect(res.data.estimatedAmount).toBe(25000);
        expect(res.data.estimatedCost).toBe(25000);
        expect(res.data.actualAmount).toBe(0);
        expect(res.data.status).toBe("planned");
      }
    });

    it("accepts UI format with { category, name, estimatedAmount } via dual transform", () => {
      const payload = {
        category: "catering",
        name: "Welcome Drinks",
        estimatedAmount: 15000,
        actualAmount: 5000,
        status: "booked",
      };
      const res = addBudgetItemSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.item).toBe("Welcome Drinks");
        expect(res.data.name).toBe("Welcome Drinks");
        expect(res.data.estimatedCost).toBe(15000);
        expect(res.data.estimatedAmount).toBe(15000);
        expect(res.data.actualAmount).toBe(5000);
        expect(res.data.status).toBe("booked");
      }
    });

    it("rejects negative estimated cost and invalid category", () => {
      expect(addBudgetItemSchema.safeParse({ category: "venue", item: "Hall", estimatedCost: -500 }).success).toBe(false);
      expect(addBudgetItemSchema.safeParse({ category: "invalid_category", item: "Hall", estimatedCost: 500 }).success).toBe(false);
      expect(addBudgetItemSchema.safeParse({ category: "venue" }).success).toBe(false);
    });
  });

  describe("deleteBudgetItemSchema", () => {
    it("accepts valid itemId and rejects empty string", () => {
      expect(deleteBudgetItemSchema.safeParse({ itemId: "bgt-1" }).success).toBe(true);
      expect(deleteBudgetItemSchema.safeParse({ itemId: "" }).success).toBe(false);
    });
  });

  describe("addTaskSchema", () => {
    it("accepts valid task with ISO date format", () => {
      const payload = {
        title: "Book Pandit Ji",
        category: "Rituals",
        dueDate: "2027-04-15",
        priority: "high",
        status: "pending",
      };
      const res = addTaskSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.title).toBe("Book Pandit Ji");
        expect(res.data.priority).toBe("high");
        expect(res.data.isOverdue).toBe(false);
      }
    });

    it("rejects malformed date and empty title", () => {
      expect(addTaskSchema.safeParse({ title: "", category: "General", dueDate: "2027-04-15" }).success).toBe(false);
      expect(addTaskSchema.safeParse({ title: "Task", category: "General", dueDate: "15/04/2027" }).success).toBe(false);
      expect(addTaskSchema.safeParse({ title: "Task", category: "General", dueDate: "invalid-date" }).success).toBe(false);
    });
  });

  describe("deleteTaskSchema", () => {
    it("accepts valid taskId and rejects empty string", () => {
      expect(deleteTaskSchema.safeParse({ taskId: "tsk-1" }).success).toBe(true);
      expect(deleteTaskSchema.safeParse({ taskId: "" }).success).toBe(false);
    });
  });

  describe("addVendorSchema", () => {
    it("accepts canonical schema with { name, category, contact }", () => {
      const payload = {
        name: "Royal Photo Studio",
        category: "Photography",
        contact: "Vikram Sharma",
        phone: "+91 98765 43210",
        email: "vikram@studio.example.com",
        estimatedQuote: 45000,
      };
      const res = addVendorSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.businessName).toBe("Royal Photo Studio");
        expect(res.data.contactPerson).toBe("Vikram Sharma");
        expect(res.data.estimatedQuote).toBe(45000);
        expect(res.data.finalQuote).toBe(0);
        expect(res.data.status).toBe("not_contacted");
      }
    });

    it("accepts UI format with { businessName, contactPerson, finalQuote }", () => {
      const payload = {
        businessName: "Gourmet Caterers",
        category: "Catering",
        contactPerson: "Chef Ananya",
        finalQuote: 85000,
        status: "booked",
      };
      const res = addVendorSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.name).toBe("Gourmet Caterers");
        expect(res.data.businessName).toBe("Gourmet Caterers");
        expect(res.data.contact).toBe("Chef Ananya");
        expect(res.data.status).toBe("booked");
      }
    });

    it("rejects invalid email and missing business name", () => {
      expect(addVendorSchema.safeParse({ category: "Venue", email: "not-an-email" }).success).toBe(false);
      expect(addVendorSchema.safeParse({ category: "Venue" }).success).toBe(false);
    });
  });

  describe("deleteVendorSchema", () => {
    it("accepts valid vendorId and rejects empty string", () => {
      expect(deleteVendorSchema.safeParse({ vendorId: "vnd-1" }).success).toBe(true);
      expect(deleteVendorSchema.safeParse({ vendorId: "" }).success).toBe(false);
    });
  });

  describe("patchEventSchema", () => {
    it("accepts partial updates to event notes, status, and fields", () => {
      expect(patchEventSchema.safeParse({ notes: "Updated instructions" }).success).toBe(true);
      expect(patchEventSchema.safeParse({ status: "confirmed" }).success).toBe(true);
      expect(patchEventSchema.safeParse({ totalBudget: 500000, guestCount: 300 }).success).toBe(true);
    });

    it("rejects empty object update", () => {
      const res = patchEventSchema.safeParse({});
      expect(res.success).toBe(false);
    });

    it("rejects invalid status enum or negative budget", () => {
      expect(patchEventSchema.safeParse({ status: "invalid_status" }).success).toBe(false);
      expect(patchEventSchema.safeParse({ totalBudget: -100 }).success).toBe(false);
    });
  });

  describe("refineRequestSchema", () => {
    it("accepts valid prompt with boolean applyAction", () => {
      const res = refineRequestSchema.safeParse({ prompt: "Reduce budget by 10%", applyAction: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.prompt).toBe("Reduce budget by 10%");
        expect(res.data.applyAction).toBe(true);
      }
    });

    it("rejects empty prompt string or prompt exceeding 1000 characters", () => {
      expect(refineRequestSchema.safeParse({ prompt: "" }).success).toBe(false);
      expect(refineRequestSchema.safeParse({ prompt: "   " }).success).toBe(false);
      expect(refineRequestSchema.safeParse({ prompt: "a".repeat(1001) }).success).toBe(false);
    });
  });

  describe("formatZodError", () => {
    it("formats ZodError into Record<string, string[]>", () => {
      const parsed = addTaskSchema.safeParse({ title: "", category: "General", dueDate: "bad-date" });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const formatted = formatZodError(parsed.error);
        expect(formatted.title).toBeDefined();
        expect(Array.isArray(formatted.title)).toBe(true);
        expect(formatted.dueDate).toBeDefined();
        expect(Array.isArray(formatted.dueDate)).toBe(true);
      }
    });
  });
});
