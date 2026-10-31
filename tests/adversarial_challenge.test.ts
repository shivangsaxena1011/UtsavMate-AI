import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { getDaysUntil, formatDisplayDate } from "../src/lib/utils/date";
import { useNewEventForm, INITIAL_FORM_DATA, EVENT_TYPES, LANG_OPTIONS, STEP_LABELS } from "../src/hooks/useNewEventForm";

/**
 * Lightweight Hook Testing Harness for React 19 in Node environment
 */
function renderHook<T>(hookFn: () => T): { result: { current: T }; rerender: () => void } {
  const states: unknown[] = [];
  let hookIndex = 0;

  const dispatcher = {
    useState<S>(initialState: S | (() => S)): [S, (update: S | ((prev: S) => S)) => void] {
      const id = hookIndex++;
      if (states.length <= id) {
        states[id] = typeof initialState === "function" ? (initialState as () => S)() : initialState;
      }
      const setState = (update: S | ((prev: S) => S)) => {
        states[id] = typeof update === "function" ? (update as (prev: S) => S)(states[id] as S) : update;
        rerun();
      };
      return [states[id] as S, setState];
    },
  };

  let currentResult: T;

  function rerun() {
    hookIndex = 0;
    // @ts-expect-error React 19 internal dispatcher
    const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevDispatcher = internals.H;
    internals.H = dispatcher;
    try {
      currentResult = hookFn();
    } finally {
      internals.H = prevDispatcher;
    }
  }

  rerun();

  return {
    result: {
      get current() {
        return currentResult;
      },
    },
    rerender: rerun,
  };
}

describe("Adversarial Stress Test: Date Utility (date.ts)", () => {
  it("computes accurate days for future dates", () => {
    const base = new Date("2026-10-31T00:00:00.000Z");
    expect(getDaysUntil("2026-11-01T00:00:00.000Z", base)).toBe(1);
    expect(getDaysUntil("2026-11-10T00:00:00.000Z", base)).toBe(10);
    expect(getDaysUntil("2027-10-31T00:00:00.000Z", base)).toBe(365);
  });

  it("handles same-day calculations across different hours of the day", () => {
    const eventDateStr = "2026-10-31";
    // Midnight
    const atMidnight = new Date("2026-10-31T00:00:00.000Z");
    expect(getDaysUntil(eventDateStr, atMidnight)).toBe(0);

    // Noon
    const atNoon = new Date("2026-10-31T12:00:00.000Z");
    const resultNoon = getDaysUntil(eventDateStr, atNoon);
    expect(Object.is(resultNoon, -0) || resultNoon === 0).toBe(true);

    // End of day
    const atEndOfDay = new Date("2026-10-31T23:59:59.000Z");
    const resultEOD = getDaysUntil(eventDateStr, atEndOfDay);
    expect(Object.is(resultEOD, -0) || resultEOD === 0).toBe(true);
  });

  it("computes negative integers for past dates", () => {
    const base = new Date("2026-10-31T00:00:00.000Z");
    expect(getDaysUntil("2026-10-30T00:00:00.000Z", base)).toBe(-1);
    expect(getDaysUntil("2026-10-21T00:00:00.000Z", base)).toBe(-10);
    expect(getDaysUntil("2025-10-31T00:00:00.000Z", base)).toBe(-365);
  });

  it("handles leap years correctly", () => {
    // 2028 is a leap year (Feb 29 exists)
    const baseFeb28_2028 = new Date("2028-02-28T00:00:00.000Z");
    expect(getDaysUntil("2028-02-29T00:00:00.000Z", baseFeb28_2028)).toBe(1);
    expect(getDaysUntil("2028-03-01T00:00:00.000Z", baseFeb28_2028)).toBe(2);

    // 2027 is NOT a leap year (Feb 29 does not exist)
    const baseFeb28_2027 = new Date("2027-02-28T00:00:00.000Z");
    expect(getDaysUntil("2027-03-01T00:00:00.000Z", baseFeb28_2027)).toBe(1);
  });

  it("handles timezone offsets and boundaries", () => {
    // Indian Standard Time (UTC+5:30)
    // 2026-11-01 at 01:00 AM IST is 2026-10-31 19:30 UTC
    const istEarlyMorning = new Date("2026-11-01T01:00:00+05:30");
    const days = getDaysUntil("2026-11-01", istEarlyMorning);
    expect(days).toBe(1);
  });

  it("survives malformed, invalid, or empty date strings without throwing", () => {
    expect(Number.isNaN(getDaysUntil(""))).toBe(true);
    expect(Number.isNaN(getDaysUntil("invalid-string"))).toBe(true);
    expect(Number.isNaN(getDaysUntil("2026-99-99"))).toBe(true);
  });

  it("formats display dates safely according to en-IN locale", () => {
    const formatted = formatDisplayDate("2027-02-15");
    expect(formatted).toContain("15");
    expect(formatted).toContain("Feb");
    expect(formatted).toContain("2027");

    // Falls back to original string when invalid
    expect(formatDisplayDate("invalid-date-string")).toBe("invalid-date-string");
    expect(formatDisplayDate("")).toBe("");
  });
});

describe("Adversarial Stress Test: New Event Form Hook (useNewEventForm.ts)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("initializes with valid default constants and initial state", () => {
    expect(EVENT_TYPES.length).toBe(6);
    expect(LANG_OPTIONS.length).toBe(3);
    expect(STEP_LABELS).toEqual(["Event Basics", "Requirements", "Preferences"]);

    const { result } = renderHook(() => useNewEventForm());
    expect(result.current.step).toBe(1);
    expect(result.current.formData).toEqual(INITIAL_FORM_DATA);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.validationErrors).toEqual({});
  });

  it("adversarially stress-tests Step 1 validation", () => {
    const { result } = renderHook(() => useNewEventForm());

    // 1. Initial attempt with empty fields
    const res1 = result.current.nextStep();
    expect(res1).toBe(false);
    expect(result.current.step).toBe(1);
    expect(result.current.error).toBe("Event title is required.");
    expect(result.current.validationErrors.title).toBe("Event title is required.");
    expect(result.current.validationErrors.eventType).toBe("Please select an event type.");
    expect(result.current.validationErrors.eventDate).toBe("Event date is required.");

    // 2. Whitespace-only title
    result.current.updateField("title", "   ");
    expect(result.current.nextStep()).toBe(false);
    expect(result.current.error).toBe("Event title is required.");

    // 3. Valid title provided, eventType still missing
    result.current.updateField("title", "Aarav & Meera Wedding");
    // validation error for title should be cleared on updateField
    expect(result.current.validationErrors.title).toBeUndefined();
    expect(result.current.nextStep()).toBe(false);
    expect(result.current.error).toBe("Please select an event type.");

    // 4. Valid eventType provided, date still missing
    result.current.updateField("eventType", "wedding");
    expect(result.current.nextStep()).toBe(false);
    expect(result.current.error).toBe("Event date is required.");

    // 5. Valid date provided -> progression succeeds
    result.current.updateField("eventDate", "2027-02-15");
    const successStep1 = result.current.nextStep();
    expect(successStep1).toBe(true);
    expect(result.current.step).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("adversarially stress-tests Step 2 validation with invalid, 0, negative, and malformed inputs", () => {
    const { result } = renderHook(() => useNewEventForm());

    // Pass Step 1
    result.current.updateField("title", "College Cultural Fest 2027");
    result.current.updateField("eventType", "college_fest");
    result.current.updateField("eventDate", "2027-03-20");
    expect(result.current.nextStep()).toBe(true);
    expect(result.current.step).toBe(2);

    // 1. All Step 2 fields empty
    expect(result.current.nextStep()).toBe(false);
    expect(result.current.step).toBe(2);
    expect(result.current.error).toBe("City is required.");
    expect(result.current.validationErrors.city).toBe("City is required.");
    expect(result.current.validationErrors.guestCount).toBe("Enter a valid guest count.");
    expect(result.current.validationErrors.totalBudget).toBe("Enter a valid budget (min ₹1,000).");

    // 2. Whitespace-only city
    result.current.updateField("city", "   ");
    expect(result.current.nextStep()).toBe(false);
    expect(result.current.error).toBe("City is required.");

    // Set valid city
    result.current.updateField("city", "Indore");

    // 3. Guest count stress tests: 0, negative, non-numeric, decimal < 1
    const invalidGuests = ["0", "-1", "-50", "abc", "NaN", "0.5"];
    for (const badGuest of invalidGuests) {
      result.current.updateField("guestCount", badGuest);
      expect(result.current.nextStep()).toBe(false);
      expect(result.current.error).toBe("Enter a valid guest count.");
    }

    // Set valid guest count
    result.current.updateField("guestCount", "500");

    // 4. Budget stress tests: 0, negative, sub-1000, non-numeric
    const invalidBudgets = ["0", "-100", "-50000", "500", "999", "free", "NaN"];
    for (const badBudget of invalidBudgets) {
      result.current.updateField("totalBudget", badBudget);
      expect(result.current.nextStep()).toBe(false);
      expect(result.current.error).toBe("Enter a valid budget (min ₹1,000).");
    }

    // Exactly min budget (1000)
    result.current.updateField("totalBudget", "1000");
    expect(result.current.nextStep()).toBe(true);
    expect(result.current.step).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it("verifies bidirectional step navigation (nextStep, prevStep, setStepDirectly)", () => {
    const { result } = renderHook(() => useNewEventForm());

    // Step 1: boundary check for prevStep
    expect(result.current.step).toBe(1);
    result.current.prevStep();
    expect(result.current.step).toBe(1); // Cannot go below 1

    // Advance to Step 2
    result.current.updateField("title", "Birthday Party");
    result.current.updateField("eventType", "birthday");
    result.current.updateField("eventDate", "2027-01-01");
    expect(result.current.nextStep()).toBe(true);
    expect(result.current.step).toBe(2);

    // Advance to Step 3
    result.current.updateField("city", "Bhopal");
    result.current.updateField("guestCount", "50");
    result.current.updateField("totalBudget", "25000");
    expect(result.current.nextStep()).toBe(true);
    expect(result.current.step).toBe(3);

    // Step 3: boundary check for nextStep
    expect(result.current.nextStep()).toBe(true);
    expect(result.current.step).toBe(3); // Cannot exceed 3

    // Navigate back to 2
    result.current.prevStep();
    expect(result.current.step).toBe(2);

    // Navigate back to 1
    result.current.prevStep();
    expect(result.current.step).toBe(1);

    // setStepDirectly
    result.current.setStepDirectly(3);
    expect(result.current.step).toBe(3);
  });

  it("constructs accurate API payload with language, eventType mapping, and number parsing", async () => {
    let capturedPayload: Record<string, unknown> | null = null;
    let capturedUrl: string | null = null;

    global.fetch = vi.fn().mockImplementation((url, init) => {
      capturedUrl = String(url);
      capturedPayload = JSON.parse(init.body as string);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, plan: { event: { id: "evt_test_789" } } }),
      });
    });

    const { result } = renderHook(() => useNewEventForm());

    // Populate all fields across all steps
    result.current.updateField("title", "TechFest 2027");
    result.current.updateField("eventType", "college_event"); // Should map to college_fest
    result.current.updateField("eventDate", "2027-04-10");
    result.current.updateField("city", "Jabalpur");
    result.current.updateField("guestCount", "1200");
    result.current.updateField("totalBudget", "350000");
    result.current.updateField("theme", "Neon Cyberpunk");
    result.current.updateField("dietaryRequirements", "Vegetarian & Jain counters");
    result.current.updateField("accessibilityNeeds", "Wheelchair ramps");
    result.current.updateField("culturalPreferences", "Traditional welcome lamp");
    result.current.updateField("additionalNotes", "Need acoustic sound check by 10 AM");
    result.current.updateField("preferredLanguage", "hindi"); // Should map to "hi"

    result.current.setStepDirectly(3);

    const eventId = await result.current.submitForm();

    expect(eventId).toBe("evt_test_789");
    expect(capturedUrl).toBe("/api/events");
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload!.title).toBe("TechFest 2027");
    expect(capturedPayload!.eventType).toBe("college_fest"); // Mapped
    expect(capturedPayload!.language).toBe("hi"); // Mapped
    expect(capturedPayload!.guestCount).toBe(1200); // Parsed as Number
    expect(capturedPayload!.totalBudget).toBe(350000); // Parsed as Number
    expect(capturedPayload!.dietaryPreferences).toBe("Vegetarian & Jain counters"); // Mapped
    expect(capturedPayload!.notes).toBe("Need acoustic sound check by 10 AM"); // Mapped
  });

  it("maps hinglish and english language options correctly in payload", async () => {
    const payloads: Record<string, unknown>[] = [];
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      payloads.push(JSON.parse(init.body as string));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, event: { id: "evt_id" } }),
      });
    });

    const { result } = renderHook(() => useNewEventForm());
    result.current.updateField("title", "Event");
    result.current.updateField("eventType", "custom");
    result.current.updateField("eventDate", "2027-05-01");
    result.current.updateField("city", "Pune");
    result.current.updateField("guestCount", "100");
    result.current.updateField("totalBudget", "50000");

    // Hinglish test
    result.current.updateField("preferredLanguage", "hinglish");
    result.current.setStepDirectly(3);
    await result.current.submitForm();
    expect(payloads[0].language).toBe("hinglish");

    // English test
    result.current.updateField("preferredLanguage", "english");
    await result.current.submitForm();
    expect(payloads[1].language).toBe("en");
  });

  it("handles HTTP error status and network failure gracefully during submitForm", async () => {
    // 1. Server returns 400 with error details
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "City is currently unserviceable" }),
    });

    const { result } = renderHook(() => useNewEventForm());
    result.current.setStepDirectly(3);
    const id1 = await result.current.submitForm();
    expect(id1).toBeNull();
    expect(result.current.error).toBe("City is currently unserviceable");
    expect(result.current.loading).toBe(false);

    // 2. Network throw
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection dropped"));
    const id2 = await result.current.submitForm();
    expect(id2).toBeNull();
    expect(result.current.error).toBe("Network connection dropped");
    expect(result.current.loading).toBe(false);

    // 3. Server returns success but missing event ID
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
    const id3 = await result.current.submitForm();
    expect(id3).toBeNull();
    expect(result.current.error).toBe("Event was created but no ID was returned.");
  });

  it("REVEALS EDGE CASE: submitForm called at step 3 when prior steps were bypassed does not validate steps 1 and 2", async () => {
    let capturedBody: Record<string, unknown> | null = null;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = JSON.parse(init.body as string);
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Validation failed" }),
      });
    });

    const { result } = renderHook(() => useNewEventForm());

    // Directly jump to step 3 without filling step 1 or 2
    result.current.setStepDirectly(3);

    // Calling submitForm should ideally validate the entire form,
    // but validateStep(3) only checks currentStep === 3 (which has no checks)
    const eventId = await result.current.submitForm();
    expect(eventId).toBeNull();
    // It proceeded to call fetch with empty values and failed at backend
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.title).toBe("");
    expect(capturedBody!.guestCount).toBe(0);
    expect(capturedBody!.totalBudget).toBe(0);
  });
});
