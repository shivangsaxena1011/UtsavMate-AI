import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
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
import {
  createNewEvent,
  getEventPlan,
  deleteEvent,
} from "../src/lib/storage";
import { POST as postBudget, DELETE as deleteBudget } from "../src/app/api/events/[id]/budget/route";
import { POST as postTasks, DELETE as deleteTasks } from "../src/app/api/events/[id]/tasks/route";
import { POST as postVendors, DELETE as deleteVendors } from "../src/app/api/events/[id]/vendors/route";
import { GET as getEvent, PATCH as patchEvent, DELETE as deleteEventRoute } from "../src/app/api/events/[id]/route";
import { POST as postRefine } from "../src/app/api/events/[id]/refine/route";
import { POST as postCreateEvent } from "../src/app/api/events/route";
import { GET as getExport } from "../src/app/api/events/[id]/export/route";

/**
 * Helper to construct a NextRequest with optional JSON or raw string body.
 */
function createMockRequest(
  url: string,
  method: string,
  body?: string | Record<string, unknown> | null,
  isRawString: boolean = false
): NextRequest {
  const headers = new Headers({ "Content-Type": "application/json" });
  const init: { method: string; headers: Headers; body?: string } = {
    method,
    headers,
  };

  if (body !== undefined && body !== null) {
    init.body = isRawString ? (body as string) : JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

describe("Empirical Adversarial Challenge: Schema & Validation Edge Cases", () => {
  describe("1. addBudgetItemSchema Robustness", () => {
    it("rejects non-object payloads (numbers, strings, arrays, booleans, null)", () => {
      expect(addBudgetItemSchema.safeParse(null).success).toBe(false);
      expect(addBudgetItemSchema.safeParse(undefined).success).toBe(false);
      expect(addBudgetItemSchema.safeParse(12345).success).toBe(false);
      expect(addBudgetItemSchema.safeParse("string payload").success).toBe(false);
      expect(addBudgetItemSchema.safeParse(true).success).toBe(false);
      expect(addBudgetItemSchema.safeParse([]).success).toBe(false);
    });

    it("rejects empty object payload and missing required fields", () => {
      // Empty object fails on base required category
      const resEmpty = addBudgetItemSchema.safeParse({});
      expect(resEmpty.success).toBe(false);
      if (!resEmpty.success) {
        const errors = formatZodError(resEmpty.error);
        expect(errors.category).toBeDefined();
      }

      // Missing item/name fails on refinement
      const resMissingItem = addBudgetItemSchema.safeParse({
        category: "decor",
        estimatedCost: 1000,
      });
      expect(resMissingItem.success).toBe(false);
      if (!resMissingItem.success) {
        const errors = formatZodError(resMissingItem.error);
        expect(errors.item).toBeDefined();
      }

      // Missing estimatedCost/estimatedAmount fails on refinement
      const resMissingCost = addBudgetItemSchema.safeParse({
        category: "decor",
        item: "Lighting",
      });
      expect(resMissingCost.success).toBe(false);
      if (!resMissingCost.success) {
        const errors = formatZodError(resMissingCost.error);
        expect(errors.estimatedCost).toBeDefined();
      }
    });

    it("rejects negative values for estimatedCost, estimatedAmount, and actualAmount", () => {
      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          item: "Stage Decor",
          estimatedCost: -1,
        }).success
      ).toBe(false);

      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          name: "Stage Decor",
          estimatedAmount: -0.01,
        }).success
      ).toBe(false);

      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          item: "Stage Decor",
          estimatedCost: 1000,
          actualAmount: -50,
        }).success
      ).toBe(false);
    });

    it("rejects type mismatches (string numbers, object names)", () => {
      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          item: "Stage Decor",
          estimatedCost: "5000", // String instead of number
        }).success
      ).toBe(false);

      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          item: { nested: "object" }, // Object instead of string
          estimatedCost: 5000,
        }).success
      ).toBe(false);
    });

    it("safely ignores extra unknown fields without allowing prototype pollution", () => {
      const payload = {
        category: "decor",
        item: "Lighting Rig",
        estimatedCost: 20000,
        extraMaliciousField: "injection",
        __proto__: { polluted: true },
      };
      const res = addBudgetItemSchema.safeParse(payload);
      expect(res.success).toBe(true);
      if (res.success) {
        expect((res.data as Record<string, unknown>).extraMaliciousField).toBeUndefined();
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(res.data.name).toBe("Lighting Rig");
        expect(res.data.estimatedCost).toBe(20000);
      }
    });

    it("accepts boundary zero value for estimatedCost and actualAmount", () => {
      const res = addBudgetItemSchema.safeParse({
        category: "other",
        item: "Complimentary Welcome Kits",
        estimatedCost: 0,
        actualAmount: 0,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.estimatedCost).toBe(0);
        expect(res.data.actualAmount).toBe(0);
      }
    });

    it("rejects empty or whitespace-only item and name", () => {
      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          item: "   ",
          estimatedCost: 1000,
        }).success
      ).toBe(false);

      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          name: "",
          estimatedAmount: 1000,
        }).success
      ).toBe(false);
    });

    it("rejects notes exceeding 1000 characters", () => {
      expect(
        addBudgetItemSchema.safeParse({
          category: "decor",
          item: "Backdrop",
          estimatedCost: 1000,
          notes: "x".repeat(1001),
        }).success
      ).toBe(false);
    });
  });

  describe("2. addTaskSchema Robustness", () => {
    it("rejects missing title or empty dueDate", () => {
      expect(addTaskSchema.safeParse({}).success).toBe(false);
      expect(addTaskSchema.safeParse({ title: "Task" }).success).toBe(false);
      expect(addTaskSchema.safeParse({ dueDate: "2027-05-01" }).success).toBe(false);
    });

    it("strictly rejects malformed dates (non-ISO, slashed, word dates)", () => {
      const badDates = ["01-05-2027", "2027/05/01", "May 1, 2027", "2027-5-1", "invalid"];
      for (const d of badDates) {
        expect(
          addTaskSchema.safeParse({
            title: "Task",
            category: "General",
            dueDate: d,
          }).success
        ).toBe(false);
      }
    });

    it("rejects titles exceeding 200 characters and empty titles", () => {
      expect(
        addTaskSchema.safeParse({
          title: "",
          category: "General",
          dueDate: "2027-05-01",
        }).success
      ).toBe(false);

      expect(
        addTaskSchema.safeParse({
          title: "t".repeat(201),
          category: "General",
          dueDate: "2027-05-01",
        }).success
      ).toBe(false);
    });

    it("rejects invalid priority and status enumerations", () => {
      expect(
        addTaskSchema.safeParse({
          title: "Task",
          category: "General",
          dueDate: "2027-05-01",
          priority: "urgent", // Not in TaskPriorityEnum (high, medium, low)
        }).success
      ).toBe(false);

      expect(
        addTaskSchema.safeParse({
          title: "Task",
          category: "General",
          dueDate: "2027-05-01",
          status: "done", // Not in TaskStatusEnum (pending, in_progress, completed)
        }).success
      ).toBe(false);
    });
  });

  describe("3. addVendorSchema Robustness", () => {
    it("rejects empty payload and missing name/businessName", () => {
      expect(addVendorSchema.safeParse({}).success).toBe(false);
      expect(addVendorSchema.safeParse({ category: "Catering" }).success).toBe(false);
    });

    it("rejects negative quotes", () => {
      expect(
        addVendorSchema.safeParse({
          name: "Vendor A",
          category: "Catering",
          estimatedQuote: -1,
        }).success
      ).toBe(false);

      expect(
        addVendorSchema.safeParse({
          businessName: "Vendor B",
          category: "Catering",
          finalQuote: -500,
        }).success
      ).toBe(false);
    });

    it("rejects malformed email addresses while accepting valid emails or empty string", () => {
      expect(
        addVendorSchema.safeParse({
          name: "Vendor C",
          category: "Photo",
          email: "not-an-email",
        }).success
      ).toBe(false);

      expect(
        addVendorSchema.safeParse({
          name: "Vendor C",
          category: "Photo",
          email: "",
        }).success
      ).toBe(true);

      expect(
        addVendorSchema.safeParse({
          name: "Vendor C",
          category: "Photo",
          email: "valid@vendor.com",
        }).success
      ).toBe(true);
    });

    it("rejects malformed follow-up dates while accepting empty string", () => {
      expect(
        addVendorSchema.safeParse({
          name: "Vendor D",
          category: "Photo",
          followUpDate: "2027/05/10",
        }).success
      ).toBe(false);

      expect(
        addVendorSchema.safeParse({
          name: "Vendor D",
          category: "Photo",
          followUpDate: "2027-05-10",
        }).success
      ).toBe(true);

      expect(
        addVendorSchema.safeParse({
          name: "Vendor D",
          category: "Photo",
          followUpDate: "",
        }).success
      ).toBe(true);
    });
  });

  describe("4. patchEventSchema Robustness", () => {
    it("rejects empty object payload (no fields provided)", () => {
      const res = patchEventSchema.safeParse({});
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain("At least one field must be provided");
      }
    });

    it("rejects payload containing ONLY unknown fields (which get stripped, leaving empty data)", () => {
      const res = patchEventSchema.safeParse({
        unknownField1: "test",
        unknownField2: 123,
      });
      expect(res.success).toBe(false);
    });

    it("rejects invalid status enum", () => {
      expect(patchEventSchema.safeParse({ status: "archived" }).success).toBe(false);
      expect(patchEventSchema.safeParse({ status: "finished" }).success).toBe(false);
    });

    it("rejects negative or excessive budget", () => {
      expect(patchEventSchema.safeParse({ totalBudget: -1 }).success).toBe(false);
      expect(patchEventSchema.safeParse({ totalBudget: 100000001 }).success).toBe(false);
    });

    it("rejects 0, negative, float, or excessive guest count", () => {
      expect(patchEventSchema.safeParse({ guestCount: 0 }).success).toBe(false);
      expect(patchEventSchema.safeParse({ guestCount: -5 }).success).toBe(false);
      expect(patchEventSchema.safeParse({ guestCount: 50.5 }).success).toBe(false);
      expect(patchEventSchema.safeParse({ guestCount: 50001 }).success).toBe(false);
    });

    it("rejects notes exceeding 2000 characters", () => {
      expect(patchEventSchema.safeParse({ notes: "n".repeat(2001) }).success).toBe(false);
    });
  });

  describe("5. refineRequestSchema Robustness", () => {
    it("rejects empty, whitespace-only, or missing prompt", () => {
      expect(refineRequestSchema.safeParse({}).success).toBe(false);
      expect(refineRequestSchema.safeParse({ prompt: "" }).success).toBe(false);
      expect(refineRequestSchema.safeParse({ prompt: "   " }).success).toBe(false);
    });

    it("rejects prompt exceeding 1000 characters", () => {
      expect(refineRequestSchema.safeParse({ prompt: "p".repeat(1001) }).success).toBe(false);
    });

    it("rejects type mismatch for applyAction", () => {
      expect(refineRequestSchema.safeParse({ prompt: "valid", applyAction: "true" }).success).toBe(false);
      expect(refineRequestSchema.safeParse({ prompt: "valid", applyAction: 1 }).success).toBe(false);
    });
  });
});

describe("Empirical Adversarial Challenge: End-to-End API Route Handlers", () => {
  let testEventId: string;

  beforeEach(async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const plan = await createNewEvent({
        title: "Adversarial Test Event",
        eventType: "birthday",
        eventDate: "2027-09-15",
        city: "Bhopal",
        guestCount: 50,
        totalBudget: 75000,
        language: "en",
      });
      testEventId = plan.event.id;
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  afterEach(() => {
    if (testEventId) {
      deleteEvent(testEventId);
    }
  });

  describe("POST /api/events/[id]/budget", () => {
    it("returns HTTP 400 for malformed JSON without crashing or mutating state", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialCount = initialPlan.budget.length;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/budget`,
        "POST",
        "{ malformed json string :",
        true
      );
      const res = await postBudget(req, { params: Promise.resolve({ id: testEventId }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid JSON payload");

      // Verify state was NOT mutated
      const planAfter = getEventPlan(testEventId)!;
      expect(planAfter.budget.length).toBe(initialCount);
    });

    it("returns HTTP 400 with structured validation details for invalid payload", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialCount = initialPlan.budget.length;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/budget`,
        "POST",
        {
          category: "invalid_category",
          item: "",
          estimatedCost: -500,
        }
      );
      const res = await postBudget(req, { params: Promise.resolve({ id: testEventId }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
      expect(data.details.category).toBeDefined();

      // Verify state was NOT mutated
      const planAfter = getEventPlan(testEventId)!;
      expect(planAfter.budget.length).toBe(initialCount);
    });

    it("returns HTTP 400 for invalid event ID parameter", async () => {
      const req = createMockRequest(
        "http://localhost:3000/api/events/   /budget",
        "POST",
        { category: "decor", item: "Arch", estimatedCost: 5000 }
      );
      const res = await postBudget(req, { params: Promise.resolve({ id: "   " }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Invalid event ID parameter");
    });

    it("returns HTTP 404 for non-existent event ID", async () => {
      const req = createMockRequest(
        "http://localhost:3000/api/events/non-existent-id/budget",
        "POST",
        { category: "decor", item: "Arch", estimatedCost: 5000 }
      );
      const res = await postBudget(req, { params: Promise.resolve({ id: "non-existent-id" }) });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Event not found");
    });
  });

  describe("DELETE /api/events/[id]/budget", () => {
    it("returns HTTP 400 for malformed JSON body", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/budget`,
        "DELETE",
        "bad-json",
        true
      );
      const res = await deleteBudget(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON payload");
    });

    it("returns HTTP 400 for empty or invalid itemId", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/budget`,
        "DELETE",
        { itemId: "" }
      );
      const res = await deleteBudget(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details.itemId).toBeDefined();
    });
  });

  describe("POST /api/events/[id]/tasks", () => {
    it("returns HTTP 400 for malformed JSON without mutating state", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialCount = initialPlan.tasks.length;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/tasks`,
        "POST",
        "{{ malformed",
        true
      );
      const res = await postTasks(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON payload");

      expect(getEventPlan(testEventId)!.tasks.length).toBe(initialCount);
    });

    it("returns HTTP 400 for invalid task data (missing title, bad date)", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialCount = initialPlan.tasks.length;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/tasks`,
        "POST",
        {
          title: "",
          dueDate: "invalid-date",
        }
      );
      const res = await postTasks(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details.title).toBeDefined();
      expect(data.details.dueDate).toBeDefined();

      expect(getEventPlan(testEventId)!.tasks.length).toBe(initialCount);
    });
  });

  describe("DELETE /api/events/[id]/tasks", () => {
    it("returns HTTP 400 for missing or empty taskId", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/tasks`,
        "DELETE",
        { taskId: "   " }
      );
      const res = await deleteTasks(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details.taskId).toBeDefined();
    });
  });

  describe("POST /api/events/[id]/vendors", () => {
    it("returns HTTP 400 for malformed JSON without mutating state", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialCount = initialPlan.vendors.length;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/vendors`,
        "POST",
        "[invalid json",
        true
      );
      const res = await postVendors(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON payload");

      expect(getEventPlan(testEventId)!.vendors.length).toBe(initialCount);
    });

    it("returns HTTP 400 for negative quotes and malformed email", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialCount = initialPlan.vendors.length;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/vendors`,
        "POST",
        {
          category: "Catering",
          name: "Star Caterers",
          estimatedQuote: -100,
          email: "not-an-email",
        }
      );
      const res = await postVendors(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details.estimatedQuote).toBeDefined();
      expect(data.details.email).toBeDefined();

      expect(getEventPlan(testEventId)!.vendors.length).toBe(initialCount);
    });
  });

  describe("PATCH /api/events/[id]", () => {
    it("returns HTTP 400 for empty update payload", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialTitle = initialPlan.event.title;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        "PATCH",
        {}
      );
      const res = await patchEvent(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");

      expect(getEventPlan(testEventId)!.event.title).toBe(initialTitle);
    });

    it("returns HTTP 400 for negative totalBudget or 0 guestCount", async () => {
      const initialPlan = getEventPlan(testEventId)!;
      const initialBudget = initialPlan.event.totalBudget;

      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        "PATCH",
        { totalBudget: -1000, guestCount: 0 }
      );
      const res = await patchEvent(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details.totalBudget).toBeDefined();
      expect(data.details.guestCount).toBeDefined();

      expect(getEventPlan(testEventId)!.event.totalBudget).toBe(initialBudget);
    });

    it("successfully applies valid partial update (e.g. notes and status)", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        "PATCH",
        { notes: "Updated vendor notes", status: "confirmed" }
      );
      const res = await patchEvent(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.plan.event.notes).toBe("Updated vendor notes");
      expect(data.plan.event.status).toBe("confirmed");

      // Verify disk storage updated
      const updated = getEventPlan(testEventId)!;
      expect(updated.event.notes).toBe("Updated vendor notes");
      expect((updated.event as unknown as Record<string, unknown>).status).toBe("confirmed");
    });
  });

  describe("POST /api/events/[id]/refine", () => {
    it("returns HTTP 400 for malformed JSON", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/refine`,
        "POST",
        "bad-json-payload",
        true
      );
      const res = await postRefine(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON payload");
    });

    it("returns HTTP 400 for empty or whitespace-only prompt", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/refine`,
        "POST",
        { prompt: "    " }
      );
      const res = await postRefine(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details.prompt).toBeDefined();
    });
  });

  describe("POST /api/events", () => {
    it("returns HTTP 400 for malformed JSON", async () => {
      const req = createMockRequest(
        "http://localhost:3000/api/events",
        "POST",
        "corrupted json",
        true
      );
      const res = await postCreateEvent(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON payload");
    });

    it("returns HTTP 400 with fieldErrors for empty or invalid event creation input", async () => {
      const req = createMockRequest(
        "http://localhost:3000/api/events",
        "POST",
        {
          title: "",
          eventType: "not_a_valid_type",
          eventDate: "bad-date",
          city: "",
          guestCount: -10,
          totalBudget: -500,
        }
      );
      const res = await postCreateEvent(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
      expect(data.details.title).toBeDefined();
      expect(data.details.guestCount).toBeDefined();
      expect(data.details.totalBudget).toBeDefined();
    });
  });

  describe("GET /api/events/[id]/export", () => {
    it("returns HTTP 400 for invalid event ID parameter", async () => {
      const req = createMockRequest(
        "http://localhost:3000/api/events/   /export",
        "GET"
      );
      const res = await getExport(req, { params: Promise.resolve({ id: "   " }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid event ID parameter");
    });

    it("returns HTTP 404 for non-existent event", async () => {
      const req = createMockRequest(
        "http://localhost:3000/api/events/non-existent-evt/export",
        "GET"
      );
      const res = await getExport(req, { params: Promise.resolve({ id: "non-existent-evt" }) });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Event not found");
    });

    it("successfully streams markdown export for valid event", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/export?format=markdown`,
        "GET"
      );
      const res = await getExport(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/markdown");
      const text = await res.text();
      expect(text).toContain("Adversarial Test Event");
      expect(text).toContain("Bhopal");
    });
  });

  describe("6. Delete Schemas and Parameter Validation Edge Cases", () => {
    it("eventIdParamSchema rejects invalid, whitespace, and non-string IDs", () => {
      expect(eventIdParamSchema.safeParse({ id: "  " }).success).toBe(false);
      expect(eventIdParamSchema.safeParse({ id: 123 }).success).toBe(false);
      expect(eventIdParamSchema.safeParse({ id: null }).success).toBe(false);
      expect(eventIdParamSchema.safeParse({}).success).toBe(false);
    });

    it("deleteBudgetItemSchema rejects invalid or empty itemId", () => {
      expect(deleteBudgetItemSchema.safeParse({ itemId: "" }).success).toBe(false);
      expect(deleteBudgetItemSchema.safeParse({ itemId: "   " }).success).toBe(false);
      expect(deleteBudgetItemSchema.safeParse({ itemId: 123 }).success).toBe(false);
      expect(deleteBudgetItemSchema.safeParse({}).success).toBe(false);
    });

    it("deleteTaskSchema rejects invalid or empty taskId", () => {
      expect(deleteTaskSchema.safeParse({ taskId: "" }).success).toBe(false);
      expect(deleteTaskSchema.safeParse({ taskId: "   " }).success).toBe(false);
      expect(deleteTaskSchema.safeParse({ taskId: 123 }).success).toBe(false);
      expect(deleteTaskSchema.safeParse({}).success).toBe(false);
    });

    it("deleteVendorSchema rejects invalid or empty vendorId", () => {
      expect(deleteVendorSchema.safeParse({ vendorId: "" }).success).toBe(false);
      expect(deleteVendorSchema.safeParse({ vendorId: "   " }).success).toBe(false);
      expect(deleteVendorSchema.safeParse({ vendorId: 123 }).success).toBe(false);
      expect(deleteVendorSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("DELETE /api/events/[id]/vendors", () => {
    it("returns HTTP 400 for malformed JSON body", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/vendors`,
        "DELETE",
        "malformed-json",
        true
      );
      const res = await deleteVendors(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid JSON payload");
    });

    it("returns HTTP 400 for empty or invalid vendorId", async () => {
      const req = createMockRequest(
        `http://localhost:3000/api/events/${testEventId}/vendors`,
        "DELETE",
        { vendorId: "   " }
      );
      const res = await deleteVendors(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details.vendorId).toBeDefined();
    });
  });

  describe("GET and DELETE /api/events/[id]", () => {
    it("GET returns HTTP 400 for invalid event ID and 404 for non-existent event", async () => {
      const reqBad = createMockRequest("http://localhost:3000/api/events/   ", "GET");
      const resBad = await getEvent(reqBad, { params: Promise.resolve({ id: "   " }) });
      expect(resBad.status).toBe(400);

      const reqMissing = createMockRequest("http://localhost:3000/api/events/non-existent", "GET");
      const resMissing = await getEvent(reqMissing, { params: Promise.resolve({ id: "non-existent" }) });
      expect(resMissing.status).toBe(404);
    });

    it("GET returns HTTP 200 with full plan for valid event", async () => {
      const req = createMockRequest(`http://localhost:3000/api/events/${testEventId}`, "GET");
      const res = await getEvent(req, { params: Promise.resolve({ id: testEventId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.plan.event.id).toBe(testEventId);
    });

    it("DELETE returns HTTP 400 for invalid event ID and 404 for non-existent event", async () => {
      const reqBad = createMockRequest("http://localhost:3000/api/events/   ", "DELETE");
      const resBad = await deleteEventRoute(reqBad, { params: Promise.resolve({ id: "   " }) });
      expect(resBad.status).toBe(400);

      const reqMissing = createMockRequest("http://localhost:3000/api/events/non-existent", "DELETE");
      const resMissing = await deleteEventRoute(reqMissing, { params: Promise.resolve({ id: "non-existent" }) });
      expect(resMissing.status).toBe(404);
    });
  });
});

