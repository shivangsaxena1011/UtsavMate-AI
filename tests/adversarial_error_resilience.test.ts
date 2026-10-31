import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";

// Errors Under Test
import {
  AppError,
  ValidationError,
  NotFoundError,
  StorageError,
  AiServiceError,
  isAppError,
  formatErrorResponse,
} from "../src/lib/errors";

// Storage Under Test
import {
  saveEventPlan,
  getEventPlan,
  listEvents,
  deleteEvent,
} from "../src/lib/storage";
import { FullEventPlan } from "../src/lib/types";

// AI Refine Under Test
import { refinePlan } from "../src/lib/ai/refine";

// Error Boundary Components Under Test
import RootError from "../src/app/error";
import ScopedAppError from "../src/app/(app)/error";
import RootNotFound from "../src/app/not-found";
import ScopedAppNotFound from "../src/app/(app)/not-found";

// Mock @google/genai module
vi.mock("@google/genai", () => {
  const generateContentMock = vi.fn();
  class MockGoogleGenAI {
    public models = {
      generateContent: generateContentMock,
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    __mockGenerateContent: generateContentMock,
  };
});

// Helper to create a minimal valid FullEventPlan
function createSamplePlan(id: string = "evt-test-123", budget: number = 250000): FullEventPlan {
  return {
    event: {
      id,
      userId: "default-user",
      title: "Diwali Mahotsav Gala",
      eventType: "community",
      eventDate: "2027-11-01",
      city: "Ahmedabad",
      guestCount: 300,
      totalBudget: budget,
      currency: "INR",
      language: "en",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    budget: [
      {
        id: "b1",
        eventId: id,
        category: "venue",
        name: "Banquet Lawn",
        estimatedAmount: 100000,
        actualAmount: 95000,
        status: "paid",
        notes: "Advance cleared",
      },
    ],
    tasks: [
      {
        id: "t1",
        eventId: id,
        title: "Confirm Lighting Vendor",
        description: "Lighting setup for lawn",
        category: "decor",
        dueDate: "2027-10-15",
        status: "pending",
        priority: "high",
      },
    ],
    vendors: [
      {
        id: "v1",
        eventId: id,
        category: "decor",
        businessName: "Rangoli Decorators",
        estimatedQuote: 50000,
        finalQuote: 45000,
        status: "booked",
      },
    ],
    ideas: [],
    aiGenerated: false,
    aiProvider: "deterministic_fallback",
    version: 1,
  };
}

// ---------------------------------------------------------------------------
// 1. Stress-Testing: src/lib/errors/index.ts
// ---------------------------------------------------------------------------
describe("Empirical Challenger: Domain Error Hierarchy Stress Tests", () => {
  it("stress-tests AppError constructor with extreme, invalid, and edge-case values", () => {
    // Empty message
    const emptyMsgErr = new AppError("");
    expect(emptyMsgErr.message).toBe("");
    expect(emptyMsgErr.statusCode).toBe(500);
    expect(emptyMsgErr.code).toBe("INTERNAL_ERROR");
    expect(emptyMsgErr.isOperational).toBe(true);

    // Huge message (100k characters)
    const hugeMsg = "X".repeat(100_000);
    const hugeErr = new AppError(hugeMsg, 503, "OVERLOADED", false);
    expect(hugeErr.message.length).toBe(100_000);
    expect(hugeErr.statusCode).toBe(503);
    expect(hugeErr.code).toBe("OVERLOADED");
    expect(hugeErr.isOperational).toBe(false);

    // Negative and boundary status codes
    const negativeStatusErr = new AppError("Negative", -1, "NEGATIVE_STATUS");
    expect(negativeStatusErr.statusCode).toBe(-1);

    const nonStandardStatus = new AppError("Teapot", 418, "I_AM_A_TEAPOT");
    expect(nonStandardStatus.statusCode).toBe(418);

    // Unicode and emoji messages
    const unicodeErr = new AppError("शुभ विवाह उत्सव ✨🎉 त्रुटि!", 400, "CULTURAL_ERROR");
    expect(unicodeErr.message).toBe("शुभ विवाह उत्सव ✨🎉 त्रुटि!");
    expect(unicodeErr.toJSON().message).toBe("शुभ विवाह उत्सव ✨🎉 त्रुटि!");
  });

  it("verifies toJSON serialization across various detail payloads", () => {
    // Null details: should be included in toJSON()
    const nullDetailsErr = new AppError("Failed", 400, "ERR", true, null);
    expect(nullDetailsErr.toJSON()).toEqual({
      name: "AppError",
      message: "Failed",
      statusCode: 400,
      code: "ERR",
      isOperational: true,
      details: null,
    });

    // Undefined details: details key must be omitted
    const undefDetailsErr = new AppError("Failed", 500, "ERR", true, undefined);
    expect(undefDetailsErr.toJSON()).toEqual({
      name: "AppError",
      message: "Failed",
      statusCode: 500,
      code: "ERR",
      isOperational: true,
    });
    expect("details" in undefDetailsErr.toJSON()).toBe(false);

    // Falsy details (0, false, ""): must be retained and not swallowed
    const zeroDetailsErr = new AppError("Zero", 400, "ERR", true, 0);
    expect(zeroDetailsErr.toJSON().details).toBe(0);

    const falseDetailsErr = new AppError("False", 400, "ERR", true, false);
    expect(falseDetailsErr.toJSON().details).toBe(false);

    const emptyStringDetailsErr = new AppError("EmptyStr", 400, "ERR", true, "");
    expect(emptyStringDetailsErr.toJSON().details).toBe("");

    // Nested complex objects
    const complexDetails = {
      issues: [
        { path: ["event", "budget"], code: "too_small", minimum: 1000 },
        { path: ["title"], code: "required" },
      ],
      timestamp: 1730376000000,
    };
    const complexErr = new AppError("Validation Failed", 400, "VALIDATION_ERROR", true, complexDetails);
    expect(complexErr.toJSON().details).toEqual(complexDetails);
  });

  it("stress-tests all specialized subclasses for inheritance, codes, and prototype preservation", () => {
    // ValidationError
    const valErr = new ValidationError("Schema validation failed", { field: "guestCount" });
    expect(valErr).toBeInstanceOf(ValidationError);
    expect(valErr).toBeInstanceOf(AppError);
    expect(valErr).toBeInstanceOf(Error);
    expect(valErr.statusCode).toBe(400);
    expect(valErr.code).toBe("VALIDATION_ERROR");
    expect(valErr.name).toBe("ValidationError");
    expect(Object.getPrototypeOf(valErr)).toBe(ValidationError.prototype);

    // Default ValidationError without arguments
    const defaultValErr = new ValidationError();
    expect(defaultValErr.message).toBe("Validation failed");
    expect(defaultValErr.statusCode).toBe(400);
    expect(defaultValErr.details).toBeUndefined();

    // NotFoundError with identifier
    const notFoundWithId = new NotFoundError("Budget item", "item-99", { eventId: "evt-1" });
    expect(notFoundWithId).toBeInstanceOf(NotFoundError);
    expect(notFoundWithId).toBeInstanceOf(AppError);
    expect(notFoundWithId.statusCode).toBe(404);
    expect(notFoundWithId.code).toBe("NOT_FOUND");
    expect(notFoundWithId.message).toBe("Budget item with id 'item-99' not found");
    expect(notFoundWithId.details).toEqual({
      resource: "Budget item",
      identifier: "item-99",
      context: { eventId: "evt-1" },
    });

    // NotFoundError without identifier
    const notFoundGeneric = new NotFoundError("Vendor");
    expect(notFoundGeneric.message).toBe("Vendor not found");
    expect(notFoundGeneric.details).toEqual({
      resource: "Vendor",
      identifier: undefined,
    });

    // NotFoundError with empty string identifier vs "0" identifier
    const notFoundEmptyStr = new NotFoundError("Task", "");
    expect(notFoundEmptyStr.message).toBe("Task not found");

    const notFoundZero = new NotFoundError("Task", "0");
    expect(notFoundZero.message).toBe("Task with id '0' not found");

    // StorageError
    const storageErr = new StorageError("Disk I/O lock timeout", { path: "/data/events" });
    expect(storageErr).toBeInstanceOf(StorageError);
    expect(storageErr).toBeInstanceOf(AppError);
    expect(storageErr.statusCode).toBe(500);
    expect(storageErr.code).toBe("STORAGE_ERROR");
    expect(storageErr.name).toBe("StorageError");

    const defaultStorageErr = new StorageError();
    expect(defaultStorageErr.message).toBe("Storage operation failed");

    // AiServiceError
    const aiDefaultErr = new AiServiceError();
    expect(aiDefaultErr).toBeInstanceOf(AiServiceError);
    expect(aiDefaultErr).toBeInstanceOf(AppError);
    expect(aiDefaultErr.statusCode).toBe(502);
    expect(aiDefaultErr.code).toBe("AI_SERVICE_ERROR");
    expect(aiDefaultErr.name).toBe("AiServiceError");

    const aiCustomErr = new AiServiceError("Gemini rate limit exceeded", 429, { retryAfterSec: 30 });
    expect(aiCustomErr.statusCode).toBe(429);
    expect(aiCustomErr.message).toBe("Gemini rate limit exceeded");
    expect(aiCustomErr.details).toEqual({ retryAfterSec: 30 });
  });

  it("verifies multi-level inheritance when user code extends subclasses", () => {
    class CustomDatabaseError extends StorageError {
      constructor(table: string) {
        super(`Database error in table ${table}`, { table });
      }
    }

    const customErr = new CustomDatabaseError("events");
    expect(customErr).toBeInstanceOf(CustomDatabaseError);
    expect(customErr).toBeInstanceOf(StorageError);
    expect(customErr).toBeInstanceOf(AppError);
    expect(customErr).toBeInstanceOf(Error);
    expect(isAppError(customErr)).toBe(true);
    expect(customErr.statusCode).toBe(500);
    expect(customErr.code).toBe("STORAGE_ERROR");
  });

  it("stress-tests isAppError type guard against adversarial primitives and spoofed objects", () => {
    // Falsy and primitive inputs
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError(0)).toBe(false);
    expect(isAppError(NaN)).toBe(false);
    expect(isAppError("")).toBe(false);
    expect(isAppError("AppError")).toBe(false);
    expect(isAppError(true)).toBe(false);
    expect(isAppError(Symbol("AppError"))).toBe(false);
    expect(isAppError(BigInt(100))).toBe(false);

    // Standard native errors
    expect(isAppError(new Error("standard"))).toBe(false);
    expect(isAppError(new TypeError("type"))).toBe(false);
    expect(isAppError(new RangeError("range"))).toBe(false);

    // Spoofed duck-typed objects (must NOT fool isAppError)
    const spoofedObject = {
      name: "AppError",
      message: "I look like AppError",
      statusCode: 400,
      code: "VALIDATION_ERROR",
      isOperational: true,
      toJSON: () => ({}),
    };
    expect(isAppError(spoofedObject)).toBe(false);

    // Legitimate instances
    expect(isAppError(new AppError("valid"))).toBe(true);
    expect(isAppError(new ValidationError())).toBe(true);
    expect(isAppError(new NotFoundError("Event"))).toBe(true);
    expect(isAppError(new StorageError())).toBe(true);
    expect(isAppError(new AiServiceError())).toBe(true);
  });

  it("stress-tests formatErrorResponse against all possible thrown values", () => {
    // 1. Thrown AppError subclass
    const resApp = formatErrorResponse(new NotFoundError("Task", "t-505", { priority: "high" }));
    expect(resApp.status).toBe(404);
    expect(resApp.body).toEqual({
      success: false,
      error: "Task with id 't-505' not found",
      code: "NOT_FOUND",
      details: {
        resource: "Task",
        identifier: "t-505",
        context: { priority: "high" },
      },
    });

    // 2. Thrown native Error with message
    const resNative = formatErrorResponse(new Error("Connection reset by peer"));
    expect(resNative.status).toBe(500);
    expect(resNative.body).toEqual({
      success: false,
      error: "Connection reset by peer",
      code: "INTERNAL_SERVER_ERROR",
    });

    // 3. Thrown native Error with empty message
    const resNativeEmpty = formatErrorResponse(new Error(""));
    expect(resNativeEmpty.status).toBe(500);
    expect(resNativeEmpty.body).toEqual({
      success: false,
      error: "An unexpected internal server error occurred",
      code: "INTERNAL_SERVER_ERROR",
    });

    // 4. Thrown string
    const resString = formatErrorResponse("String fatal crash");
    expect(resString.status).toBe(500);
    expect(resString.body).toEqual({
      success: false,
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    });

    // 5. Thrown number, null, undefined, boolean, object
    const values = [404, null, undefined, false, { reason: "unknown" }, Symbol("err")];
    for (const val of values) {
      const res = formatErrorResponse(val);
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("UNKNOWN_ERROR");
      expect(res.body.error).toBe("An unexpected error occurred");
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Stress-Testing: src/lib/storage.ts
// ---------------------------------------------------------------------------
describe("Empirical Challenger: Storage Resilience Stress Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles filesystem write failure (ENOSPC / EACCES) gracefully without throwing, preserving data in memory", () => {
    const plan = createSamplePlan("evt-stress-fs-fail", 500000);

    // Spy and force fs.writeFileSync to throw disk full error
    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      const err = new Error("ENOSPC: no space left on device, write");
      // @ts-expect-error adding code property
      err.code = "ENOSPC";
      throw err;
    });

    // Suppress console.warn during intentional stress test
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Must NOT throw
    expect(() => saveEventPlan(plan)).not.toThrow();

    // Verify warning was logged with context
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Storage:atomicWriteJson] Failed writing to"),
      expect.stringContaining("ENOSPC")
    );

    // Verify in-memory store retained the plan
    const retrieved = getEventPlan("evt-stress-fs-fail");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.event.title).toBe("Diwali Mahotsav Gala");
    expect(retrieved?.event.totalBudget).toBe(500000);

    writeSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("handles renameSync failure (EXDEV / EBUSY) and cleans up orphaned temp file", () => {
    const plan = createSamplePlan("evt-stress-rename-fail");

    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    const renameSpy = vi.spyOn(fs, "renameSync").mockImplementation(() => {
      throw new Error("EXDEV: cross-device link not permitted");
    });
    const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const unlinkSpy = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => saveEventPlan(plan)).not.toThrow();

    // Verify temp file cleanup was attempted
    expect(unlinkSpy).toHaveBeenCalledWith(expect.stringContaining(".tmp."));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Storage:atomicWriteJson] Failed writing to"),
      expect.stringContaining("EXDEV")
    );

    renameSpy.mockRestore();
    existsSpy.mockRestore();
    unlinkSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("recovers gracefully when readdirSync or readFileSync encounters corrupt JSON files", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Mock existsSync to say directory exists
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    // Directory contains a corrupt file and a malformed schema file
    vi.spyOn(fs, "readdirSync").mockReturnValue(
      ["corrupted.json", "invalid_schema.json"] as unknown as ReturnType<typeof fs.readdirSync>
    );

    vi.spyOn(fs, "readFileSync").mockImplementation((p) => {
      const pathStr = String(p);
      if (pathStr.includes("corrupted.json")) {
        return "{ invalid json syntax: true, ";
      }
      if (pathStr.includes("invalid_schema.json")) {
        // Valid JSON but doesn't conform to FullEventPlanSchema
        return JSON.stringify({ totallyInvalid: true, foo: "bar" });
      }
      return "{}";
    });

    // listEvents must survive corrupt files without throwing
    let events: FullEventPlan["event"][] = [];
    expect(() => {
      events = listEvents();
    }).not.toThrow();

    expect(Array.isArray(events)).toBe(true);
    // Both corrupted files were logged and skipped
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Storage:listEvents] Skipped corrupt or unreadable event file"),
      expect.anything()
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Storage:listEvents] Skipped corrupt or invalid event file"),
      expect.anything()
    );

    warnSpy.mockRestore();
  });

  it("handles corrupt file safely on getEventPlan", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Ensure memory store doesn't have it
    deleteEvent("evt-corrupt-file");

    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readFileSync").mockReturnValue("BROKEN_CONTENT_NOT_JSON");

    const result = getEventPlan("evt-corrupt-file");
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Storage:getEventPlan] Error reading event plan from disk for \"evt-corrupt-file\""),
      expect.anything()
    );

    warnSpy.mockRestore();
  });

  it("handles directory read failure in listEvents by serving exclusively from in-memory cache", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Seed memory store with an event
    const memoryPlan = createSamplePlan("evt-memory-only-999");
    // Directly save to ensure memory store has it
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.spyOn(fs, "renameSync").mockImplementation(() => {});
    saveEventPlan(memoryPlan);

    // Force readdirSync to fail (e.g. permission denied)
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "readdirSync").mockImplementation(() => {
      throw new Error("EACCES: permission denied, scandir");
    });

    const events = listEvents();
    expect(Array.isArray(events)).toBe(true);
    const found = events.find((e) => e.id === "evt-memory-only-999");
    expect(found).toBeDefined();
    expect(found?.title).toBe("Diwali Mahotsav Gala");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Storage:listEvents] Failed reading events directory from disk; serving from in-memory cache:"),
      expect.stringContaining("EACCES")
    );

    warnSpy.mockRestore();
  });

  it("handles deleteEvent when disk deletion throws (EPERM)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const plan = createSamplePlan("evt-delete-fail");
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
    vi.spyOn(fs, "renameSync").mockImplementation(() => {});
    saveEventPlan(plan);

    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "unlinkSync").mockImplementation(() => {
      throw new Error("EPERM: operation not permitted, unlink");
    });

    const result = deleteEvent("evt-delete-fail");
    // Since it existed in memory, it should return true
    expect(result).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Storage:deleteEvent] Filesystem deletion failed for event \"evt-delete-fail\""),
      expect.stringContaining("EPERM")
    );

    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// 3. Stress-Testing: src/lib/ai/refine.ts
// ---------------------------------------------------------------------------
describe("Empirical Challenger: AI Refine Resilience & Provider Failure Tests", () => {
  const originalEnvKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnvKey;
  });

  it("handles deterministic mathematical budget reduction prompts with edge-case percentages", async () => {
    const plan = createSamplePlan("evt-refine-math", 100000);

    // Standard 15%
    const res15 = await refinePlan(plan, "Please reduce budget by 15%");
    expect(res15.source).toBe("deterministic_fallback");
    expect(res15.suggestedAction?.type).toBe("adjust_budget");
    expect(res15.suggestedAction?.payload?.targetBudget).toBe(85000);
    expect(res15.suggestedAction?.payload?.percentage).toBe(15);
    expect(res15.answer).toContain("To reduce your budget by 15%");

    // 0% reduction
    const res0 = await refinePlan(plan, "reduce budget by 0%");
    expect(res0.suggestedAction?.payload?.targetBudget).toBe(100000);
    expect(res0.suggestedAction?.payload?.percentage).toBe(0);

    // 100% reduction
    const res100 = await refinePlan(plan, "reduce budget by 100%");
    expect(res100.suggestedAction?.payload?.targetBudget).toBe(0);
    expect(res100.suggestedAction?.payload?.percentage).toBe(100);

    // Prompt with 'reduce' and 'budget' but no percentage specified (defaults to 10%)
    const resDefault = await refinePlan(plan, "How can we reduce our event budget?");
    expect(resDefault.suggestedAction?.payload?.percentage).toBe(10);
    expect(resDefault.suggestedAction?.payload?.targetBudget).toBe(90000);
  });

  it("handles sustainability and low-waste prompts deterministically", async () => {
    const plan = createSamplePlan("evt-refine-eco");

    const prompts = [
      "Can we make this event more eco-friendly?",
      "Suggest low-waste catering ideas",
      "What are sustainable decoration options?",
    ];

    for (const p of prompts) {
      const res = await refinePlan(plan, p);
      expect(res.source).toBe("deterministic_fallback");
      expect(res.answer).toContain("low-waste alternatives");
      expect(res.answer).toContain("Compostable Leaf Plates");
    }
  });

  it("falls back gracefully when live Gemini API throws 429 Rate Limit error", async () => {
    process.env.GEMINI_API_KEY = "test-mock-gemini-key";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Access the mocked @google/genai module
    const { __mockGenerateContent } = await import("@google/genai") as unknown as {
      __mockGenerateContent: ReturnType<typeof vi.fn>;
    };

    __mockGenerateContent.mockRejectedValueOnce(
      new Error("429 Too Many Requests: Quota exceeded for gemini-2.5-flash")
    );

    const plan = createSamplePlan("evt-gemini-429");
    const res = await refinePlan(plan, "What are the latest floral trends for Gujarati weddings?");

    expect(res.source).toBe("deterministic_fallback");
    expect(res.answer).toContain("Personalized suggestions for");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AI:refinePlan] Gemini model call failed"),
      expect.stringContaining("429 Too Many Requests")
    );

    warnSpy.mockRestore();
  });

  it("falls back gracefully when live Gemini API throws 503 Overload or Network Timeout", async () => {
    process.env.GEMINI_API_KEY = "test-mock-gemini-key";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { __mockGenerateContent } = await import("@google/genai") as unknown as {
      __mockGenerateContent: ReturnType<typeof vi.fn>;
    };

    __mockGenerateContent.mockRejectedValueOnce(
      new Error("503 Service Unavailable: The model is overloaded. Please try again later.")
    );

    const plan = createSamplePlan("evt-gemini-503");
    const res = await refinePlan(plan, "Need advice on acoustic sound design for open air lawn");

    expect(res.source).toBe("deterministic_fallback");
    expect(res.answer).toContain("Personalized suggestions for");

    warnSpy.mockRestore();
  });

  it("handles empty or blank text from live Gemini API safely", async () => {
    process.env.GEMINI_API_KEY = "test-mock-gemini-key";

    const { __mockGenerateContent } = await import("@google/genai") as unknown as {
      __mockGenerateContent: ReturnType<typeof vi.fn>;
    };

    __mockGenerateContent.mockResolvedValueOnce({
      text: "   ",
    });

    const plan = createSamplePlan("evt-gemini-empty");
    const res = await refinePlan(plan, "Any recommendations?");

    expect(res.source).toBe("gemini");
    expect(res.answer).toBe("Here are practical recommendations for your event.");
  });

  it("returns generic fallback when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;

    const plan = createSamplePlan("evt-no-key");
    const res = await refinePlan(plan, "Tell me about traditional welcome rituals");

    expect(res.source).toBe("deterministic_fallback");
    expect(res.answer).toContain("Personalized suggestions for \"Tell me about traditional welcome rituals\"");
  });
});

// ---------------------------------------------------------------------------
// 4. Stress-Testing: Next.js Error Boundaries & 404 Pages
// ---------------------------------------------------------------------------
describe("Empirical Challenger: Error Boundaries & Fallback UI Accessibility Tests", () => {
  it("verifies RootError boundary renders accessible alert markup and reset handler", () => {
    const mockReset = vi.fn();
    const error = new Error("ChunkLoadError: Loading chunk 891 failed") as Error & { digest?: string };
    error.digest = "NEXTJS_DIGEST_XYZ_123";

    // Suppress console.error inside component
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const html = renderToStaticMarkup(
      React.createElement(RootError, { error, reset: mockReset })
    );

    // Verify accessibility attributes
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("Unexpected Celebration Hiccup");
    expect(html).toContain("Don&#x27;t worry — your event data in storage remains completely safe");
    expect(html).toContain("Reference Digest: NEXTJS_DIGEST_XYZ_123");
    expect(html).toContain("Try Again");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/"');

    // Test reset trigger and useEffect directly via JSX component execution
    // @ts-expect-error React 19 internal dispatcher
    const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevDispatcher = internals.H;
    let effectCallback: (() => void) | null = null;
    internals.H = {
      useEffect: (fn: () => void) => {
        effectCallback = fn;
      },
    };

    try {
      const element = RootError({ error, reset: mockReset });
      expect(element).toBeDefined();
      expect(element.props.className).toContain("min-h-screen");

      // Verify useEffect was registered and logs to console.error
      if (effectCallback) {
        (effectCallback as () => void)();
        expect(errSpy).toHaveBeenCalledWith(
          expect.stringContaining("[RootError] Unhandled error captured by root boundary:"),
          error
        );
      }

      // Find the button in JSX props and invoke its onClick
      // element.props.children is the alert card
      const card = element.props.children;
      // card.props.children has [icon, title/p, digest, button-container]
      const buttonContainer = card.props.children[3];
      const button = buttonContainer.props.children[0];
      expect(button.type).toBe("button");
      button.props.onClick();
      expect(mockReset).toHaveBeenCalledTimes(1);
    } finally {
      internals.H = prevDispatcher;
    }

    errSpy.mockRestore();
  });

  it("verifies RootError omits digest box when error.digest is undefined", () => {
    const error = new Error("Generic failure without digest");
    const html = renderToStaticMarkup(
      React.createElement(RootError, { error, reset: () => {} })
    );

    expect(html).not.toContain("Reference Digest:");
  });

  it("verifies ScopedAppError boundary renders accessible scoped alert and retry button", () => {
    const mockReset = vi.fn();
    const error = new Error("Failed to render vendors table") as Error & { digest?: string };
    error.digest = "DIGEST-VENDOR-TAB";

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const html = renderToStaticMarkup(
      React.createElement(ScopedAppError, { error, reset: mockReset })
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
    expect(html).toContain("Unable to Load Workspace Section");
    expect(html).toContain("Error code: DIGEST-VENDOR-TAB");
    expect(html).toContain("Retry View");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/events"');

    // Test reset trigger and useEffect directly via JSX component execution
    // @ts-expect-error React 19 internal dispatcher
    const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevDispatcher = internals.H;
    let effectCallback: (() => void) | null = null;
    internals.H = {
      useEffect: (fn: () => void) => {
        effectCallback = fn;
      },
    };

    try {
      const element = ScopedAppError({ error, reset: mockReset });
      expect(element).toBeDefined();

      if (effectCallback) {
        (effectCallback as () => void)();
        expect(errSpy).toHaveBeenCalledWith(
          expect.stringContaining("[AppError] Scoped app boundary captured exception:"),
          error
        );
      }

      // element.props.children: [icon, title/p, digest, button-container]
      const buttonContainer = element.props.children[3];
      const button = buttonContainer.props.children[0];
      expect(button.type).toBe("button");
      button.props.onClick();
      expect(mockReset).toHaveBeenCalledTimes(1);
    } finally {
      internals.H = prevDispatcher;
    }

    errSpy.mockRestore();
  });

  it("verifies RootNotFound renders semantic main role and clear navigation paths", () => {
    const html = renderToStaticMarkup(React.createElement(RootNotFound));

    expect(html).toContain('role="main"');
    expect(html).toContain("404");
    expect(html).toContain("Celebration Route Not Found");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/events/new"');
    expect(html).toContain('href="/"');
  });

  it("verifies ScopedAppNotFound renders event-specific 404 guidance and links", () => {
    const html = renderToStaticMarkup(React.createElement(ScopedAppNotFound));

    expect(html).toContain("Event Not Found");
    expect(html).toContain("The celebration plan you requested could not be located");
    expect(html).toContain('href="/events"');
    expect(html).toContain('href="/events/new"');
    expect(html).toContain('href="/dashboard"');
  });
});
