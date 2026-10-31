import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import {
  createNewEvent,
  getEventPlan,
  saveEventPlan,
  listEvents,
  deleteEvent,
} from "../src/lib/storage";
import { CreateEventInput, FullEventPlan, BudgetCategory } from "../src/lib/types";
import { POST as postCreateEvent } from "../src/app/api/events/route";
import { GET as getEvent, PATCH as patchEvent, DELETE as deleteEventRoute } from "../src/app/api/events/[id]/route";
import { POST as postBudget, DELETE as deleteBudget } from "../src/app/api/events/[id]/budget/route";
import { POST as postTasks, DELETE as deleteTasks } from "../src/app/api/events/[id]/tasks/route";
import { POST as postVendors, DELETE as deleteVendors } from "../src/app/api/events/[id]/vendors/route";
import { POST as postRefine } from "../src/app/api/events/[id]/refine/route";
import { GET as getExport } from "../src/app/api/events/[id]/export/route";

// Mock @google/genai module for fast, deterministic, schema-compliant offline test execution
vi.mock("@google/genai", () => {
  class MockGoogleGenAI {
    public models = {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          overview: "A grand, culturally attuned celebration curated with royal elegance and meticulous attention to detail.",
          themeConcepts: [
            {
              name: "Royal Rajputana Grandeur",
              tagline: "Elegance steeped in timeless heritage",
              description: "Opulent heritage setting with traditional marigold, brass lamps, and royal arches.",
              colorPalette: ["#FFD700", "#800020", "#FFFFFF"],
              vibe: "Regal and traditional",
            },
          ],
          personalizedIdeas: [
            {
              section: "decor",
              title: "Floral Rangoli Welcome",
              description: "Intricate floral rangoli at palace entrance with fragrant mogra and rose petals.",
              costTier: "$$",
              tags: ["traditional", "welcome"],
            },
            {
              section: "food",
              title: "Dal Baati Churma & Live Chaat Counter",
              description: "Authentic royal delicacies served in traditional brass platters.",
              costTier: "$$$",
              tags: ["authentic", "rajasthani"],
            },
            {
              section: "activity",
              title: "Folk Puppet Show & Turban Tying Station",
              description: "Interactive cultural engagement for guests during cocktail hour.",
              costTier: "$",
              tags: ["interactive", "entertainment"],
            },
            {
              section: "saving",
              title: "Digital E-Invites with RSVP Micro-site",
              description: "Save on physical printing and courier while enabling instant guest confirmations.",
              costTier: "$",
              tags: ["eco-friendly", "digital"],
            },
          ],
          costSavingTips: [
            "Use local seasonal flowers like marigolds instead of imported orchids to reduce floral expenses by 40%.",
            "Negotiate bundled rates for photography and cinematic videography under a single production vendor.",
          ],
          riskAndContingencies: [
            "Have an indoor banquet backup ready in case of unexpected evening temperature drops.",
          ],
          nextActionRecommendations: [
            "Schedule food tasting session with caterer 60 days before event date.",
            "Finalize guest transport schedule between airport and palace venue.",
          ],
          culturalNotes: "Ensure auspicious muhurat for Shehnai entry and Phoolon ki Chaadar.",
        }),
      }),
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
  };
});

function createMockRequest(
  url: string,
  method: string,
  body?: string | Record<string, unknown> | null
): NextRequest {
  const headers = new Headers({ "Content-Type": "application/json" });
  const init: { method: string; headers: Headers; body?: string } = {
    method,
    headers,
  };
  if (body !== undefined && body !== null) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

describe("Empirical Challenger: Full Lifecycle, State Transitions & Concurrency Stress Suite", () => {
  const createdEventIds: string[] = [];
  const eventsDir = path.join(process.cwd(), "data", "events");

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Clean up created events from memory and disk
    for (const id of createdEventIds) {
      deleteEvent(id);
    }
    createdEventIds.length = 0;
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // SECTION 1: Complete User Flow Lifecycle
  // -------------------------------------------------------------------------
  describe("1. Complete User Flow: Creation -> Plan -> Workspace Mutations -> AI Refinement -> Exports", () => {
    it("executes the full end-to-end lifecycle preserving state and reflecting mutations in exports", async () => {
      // Step A: Event Creation via API POST /api/events
      const createInput: CreateEventInput = {
        title: "Raj & Simran Royal Wedding",
        eventType: "wedding",
        eventDate: "2027-12-15",
        city: "Udaipur",
        guestCount: 450,
        totalBudget: 2500000,
        theme: "Royal Rajputana Grandeur",
        style: "traditional",
        dietaryPreferences: "Pure Vegetarian, Jain food counters available",
        accessibilityNeeds: "Golf carts for elderly guests, wheelchair ramps at mandap",
        culturalPreferences: "Traditional Shehnai welcome and Phoolon ki Chaadar",
        notes: "Initial draft created by family committee",
        language: "hi",
      };

      const createReq = createMockRequest("/api/events", "POST", createInput);
      const createRes = await postCreateEvent(createReq);
      expect(createRes.status).toBe(201);
      const createData = (await createRes.json()) as { success: boolean; plan: FullEventPlan };
      expect(createData.success).toBe(true);

      const eventId = createData.plan.event.id;
      createdEventIds.push(eventId);
      expect(eventId).toMatch(/^event-/);

      // Verify Initial Plan Generation
      expect(createData.plan.event.title).toBe("Raj & Simran Royal Wedding");
      expect(createData.plan.event.totalBudget).toBe(2500000);
      expect(createData.plan.budget.length).toBeGreaterThan(0);
      expect(createData.plan.tasks.length).toBeGreaterThan(0);
      expect(createData.plan.vendors.length).toBeGreaterThan(0);
      expect(createData.plan.ideas.length).toBeGreaterThanOrEqual(3);

      // Verify Disk Storage Persistence
      const filePath = path.join(eventsDir, `${eventId}.json`);
      expect(fs.existsSync(filePath)).toBe(true);

      // Step B: Workspace Updates - Add Custom Budget Item
      const addBudgetReq = createMockRequest(`/api/events/${eventId}/budget`, "POST", {
        category: "entertainment",
        name: "Rajasthani Folk Troupe & Ghoomar Dancers",
        estimatedAmount: 75000,
        actualAmount: 70000,
        status: "planned",
        notes: "2 hour performance for Sangeet night",
      });
      const addBudgetRes = await postBudget(addBudgetReq, { params: Promise.resolve({ id: eventId }) });
      expect(addBudgetRes.status).toBe(200);
      const addBudgetData = (await addBudgetRes.json()) as { success: boolean; budget: FullEventPlan["budget"] };
      expect(addBudgetData.success).toBe(true);
      const addedBudgetItem = addBudgetData.budget.find(
        (b) => b.name === "Rajasthani Folk Troupe & Ghoomar Dancers"
      );
      expect(addedBudgetItem).toBeDefined();
      expect(addedBudgetItem?.estimatedAmount).toBe(75000);
      expect(addedBudgetItem?.actualAmount).toBe(70000);

      // Step C: Workspace Updates - Edit Existing Budget Item
      const editBudgetReq = createMockRequest(`/api/events/${eventId}/budget`, "POST", {
        id: addedBudgetItem!.id,
        category: "entertainment",
        name: "Rajasthani Folk Troupe & Ghoomar Dancers (Extended 3h)",
        estimatedAmount: 85000,
        actualAmount: 80000,
        status: "booked",
        notes: "Contract signed with troupe manager",
      });
      const editBudgetRes = await postBudget(editBudgetReq, { params: Promise.resolve({ id: eventId }) });
      expect(editBudgetRes.status).toBe(200);
      const editBudgetData = (await editBudgetRes.json()) as { success: boolean; budget: FullEventPlan["budget"] };
      const updatedItem = editBudgetData.budget.find((b) => b.id === addedBudgetItem!.id);
      expect(updatedItem?.name).toBe("Rajasthani Folk Troupe & Ghoomar Dancers (Extended 3h)");
      expect(updatedItem?.estimatedAmount).toBe(85000);
      expect(updatedItem?.status).toBe("booked");

      // Step D: Workspace Updates - Task Toggle (Pending -> Completed -> Pending)
      const targetTask = createData.plan.tasks[0];
      const toggleReq = createMockRequest(`/api/events/${eventId}/tasks`, "POST", {
        ...targetTask,
        status: "completed",
      });
      const toggleRes = await postTasks(toggleReq, { params: Promise.resolve({ id: eventId }) });
      expect(toggleRes.status).toBe(200);
      const toggleData = (await toggleRes.json()) as { success: boolean; tasks: FullEventPlan["tasks"] };
      const toggledTask = toggleData.tasks.find((t) => t.id === targetTask.id);
      expect(toggledTask?.status).toBe("completed");

      // Step E: Workspace Updates - Add New Task
      const addTaskReq = createMockRequest(`/api/events/${eventId}/tasks`, "POST", {
        title: "Arrange Vintage Car for Groom Baraat",
        category: "Logistics",
        dueDate: "2027-12-01",
        priority: "high",
        status: "pending",
        notes: "Red convertible Rolls Royce or open vintage Jeep",
      });
      const addTaskRes = await postTasks(addTaskReq, { params: Promise.resolve({ id: eventId }) });
      expect(addTaskRes.status).toBe(200);
      const addTaskData = (await addTaskRes.json()) as { success: boolean; tasks: FullEventPlan["tasks"] };
      const addedTask = addTaskData.tasks.find((t) => t.title === "Arrange Vintage Car for Groom Baraat");
      expect(addedTask).toBeDefined();
      expect(addedTask?.priority).toBe("high");

      // Step F: Workspace Updates - Update Vendor Status and Details
      const targetVendor = createData.plan.vendors[0];
      const updateVendorReq = createMockRequest(`/api/events/${eventId}/vendors`, "POST", {
        id: targetVendor.id,
        category: targetVendor.category,
        businessName: "Royal Heritage Caterers & Sweets",
        contactPerson: "Vikram Rathore",
        phone: "+91 98765 43210",
        email: "vikram@royalheritage.example.com",
        estimatedQuote: 600000,
        finalQuote: 580000,
        status: "booked",
        paymentNotes: "20% advance token paid",
      });
      const updateVendorRes = await postVendors(updateVendorReq, { params: Promise.resolve({ id: eventId }) });
      expect(updateVendorRes.status).toBe(200);
      const vendorData = (await updateVendorRes.json()) as { success: boolean; vendors: FullEventPlan["vendors"] };
      const updatedVendor = vendorData.vendors.find((v) => v.id === targetVendor.id);
      expect(updatedVendor?.businessName).toBe("Royal Heritage Caterers & Sweets");
      expect(updatedVendor?.status).toBe("booked");
      expect(updatedVendor?.finalQuote).toBe(580000);

      // Step G: Workspace Updates - PATCH Event notes
      const patchReq = createMockRequest(`/api/events/${eventId}`, "PATCH", {
        notes: "Updated by coordinator: All major contracts verified and signed.",
      });
      const patchRes = await patchEvent(patchReq, { params: Promise.resolve({ id: eventId }) });
      expect(patchRes.status).toBe(200);
      const patchData = (await patchRes.json()) as { success: boolean; plan: FullEventPlan };
      expect(patchData.plan.event.notes).toBe("Updated by coordinator: All major contracts verified and signed.");

      // Step H: AI Plan Refinement with applyAction: true
      const refineReq = createMockRequest(`/api/events/${eventId}/refine`, "POST", {
        prompt: "Please reduce budget by 10% to accommodate extra floral decor",
        applyAction: true,
      });
      const refineRes = await postRefine(refineReq, { params: Promise.resolve({ id: eventId }) });
      expect(refineRes.status).toBe(200);
      const refineData = (await refineRes.json()) as {
        success: boolean;
        answer: string;
        suggestedAction: { type: string; payload: { targetBudget: number; percentage: number } };
        updatedPlan: FullEventPlan;
      };
      expect(refineData.success).toBe(true);
      expect(refineData.suggestedAction.type).toBe("adjust_budget");
      expect(refineData.suggestedAction.payload.percentage).toBe(10);
      // Expected new total budget: 2500000 * 0.9 = 2250000
      expect(refineData.suggestedAction.payload.targetBudget).toBe(2250000);

      // Verify that the updatedPlan in storage now reflects the new target budget
      const storedPlanAfterRefine = getEventPlan(eventId);
      expect(storedPlanAfterRefine?.event.totalBudget).toBe(2250000);

      // Step I: Multi-Format Exports Verification
      // 1. Markdown Export
      const mdReq = createMockRequest(`/api/events/${eventId}/export?format=markdown`, "GET");
      const mdRes = await getExport(mdReq, { params: Promise.resolve({ id: eventId }) });
      expect(mdRes.status).toBe(200);
      expect(mdRes.headers.get("Content-Type")).toContain("text/markdown");
      const mdContent = await mdRes.text();
      expect(mdContent).toContain("# Raj & Simran Royal Wedding");
      expect(mdContent).toContain("Rajasthani Folk Troupe & Ghoomar Dancers (Extended 3h)");
      expect(mdContent).toContain("Arrange Vintage Car for Groom Baraat");
      expect(mdContent).toContain("Royal Heritage Caterers & Sweets");
      expect(mdContent).toContain("Updated by coordinator: All major contracts verified and signed.");

      // 2. Budget CSV Export
      const budgetCsvReq = createMockRequest(`/api/events/${eventId}/export?format=csv-budget`, "GET");
      const budgetCsvRes = await getExport(budgetCsvReq, { params: Promise.resolve({ id: eventId }) });
      expect(budgetCsvRes.status).toBe(200);
      expect(budgetCsvRes.headers.get("Content-Type")).toContain("text/csv");
      const budgetCsvContent = await budgetCsvRes.text();
      expect(budgetCsvContent).toContain("Category,Item Name,Estimated Amount (INR),Actual Amount (INR),Status,Notes");
      expect(budgetCsvContent).toContain('"Rajasthani Folk Troupe & Ghoomar Dancers (Extended 3h)"');
      expect(budgetCsvContent).toContain('"booked"');
      expect(budgetCsvContent).toContain("80000"); // actualAmount

      // 3. Vendor CSV Export
      const vendorCsvReq = createMockRequest(`/api/events/${eventId}/export?format=csv-vendors`, "GET");
      const vendorCsvRes = await getExport(vendorCsvReq, { params: Promise.resolve({ id: eventId }) });
      expect(vendorCsvRes.status).toBe(200);
      expect(vendorCsvRes.headers.get("Content-Type")).toContain("text/csv");
      const vendorCsvContent = await vendorCsvRes.text();
      expect(vendorCsvContent).toContain("Category,Business Name,Contact Person,Phone,Email,Estimated Quote (INR),Final Quote (INR),Status,Notes");
      expect(vendorCsvContent).toContain('"Royal Heritage Caterers & Sweets"');
      expect(vendorCsvContent).toContain('"Vikram Rathore"');
      expect(vendorCsvContent).toContain('"+91 98765 43210"');
      expect(vendorCsvContent).toContain("580000");

      // 4. iCalendar ICS Export
      const icsReq = createMockRequest(`/api/events/${eventId}/export?format=ics`, "GET");
      const icsRes = await getExport(icsReq, { params: Promise.resolve({ id: eventId }) });
      expect(icsRes.status).toBe(200);
      expect(icsRes.headers.get("Content-Type")).toContain("text/calendar");
      const icsContent = await icsRes.text();
      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("VERSION:2.0");
      expect(icsContent).toContain("Arrange Vintage Car for Groom Baraat");
      expect(icsContent).toContain("STATUS:CONFIRMED");
      expect(icsContent).toContain("STATUS:COMPLETED");
      expect(icsContent).toContain("END:VCALENDAR");

      // Step J: Delete Budget Item and Delete Task
      const delBudgetReq = createMockRequest(`/api/events/${eventId}/budget`, "DELETE", {
        itemId: addedBudgetItem!.id,
      });
      const delBudgetRes = await deleteBudget(delBudgetReq, { params: Promise.resolve({ id: eventId }) });
      expect(delBudgetRes.status).toBe(200);
      const postDeletePlan = getEventPlan(eventId);
      expect(postDeletePlan?.budget.some((b) => b.id === addedBudgetItem!.id)).toBe(false);

      const delTaskReq = createMockRequest(`/api/events/${eventId}/tasks`, "DELETE", {
        taskId: addedTask!.id,
      });
      const delTaskRes = await deleteTasks(delTaskReq, { params: Promise.resolve({ id: eventId }) });
      expect(delTaskRes.status).toBe(200);
      const postDeleteTaskPlan = getEventPlan(eventId);
      expect(postDeleteTaskPlan?.tasks.some((t) => t.id === addedTask!.id)).toBe(false);

      const delVendorReq = createMockRequest(`/api/events/${eventId}/vendors`, "DELETE", {
        vendorId: targetVendor.id,
      });
      const delVendorRes = await deleteVendors(delVendorReq, { params: Promise.resolve({ id: eventId }) });
      expect(delVendorRes.status).toBe(200);
      const postDeleteVendorPlan = getEventPlan(eventId);
      expect(postDeleteVendorPlan?.vendors.some((v) => v.id === targetVendor.id)).toBe(false);

      // Step K: Clean Deletion of Event
      const delEventReq = createMockRequest(`/api/events/${eventId}`, "DELETE");
      const delEventRes = await deleteEventRoute(delEventReq, { params: Promise.resolve({ id: eventId }) });
      expect(delEventRes.status).toBe(200);
      expect(getEventPlan(eventId)).toBeNull();
      expect(fs.existsSync(filePath)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // SECTION 2: Concurrency & Race Conditions
  // -------------------------------------------------------------------------
  describe("2. Concurrency & Race Conditions Stress Tests", () => {
    it("handles 15 concurrent event creations without ID collision or disk corruption", async () => {
      const promises: Promise<FullEventPlan>[] = [];
      for (let i = 0; i < 15; i++) {
        const input: CreateEventInput = {
          title: `Concurrent Event Test ${i}`,
          eventType: i % 2 === 0 ? "wedding" : "birthday",
          eventDate: "2027-08-10",
          city: "Pune",
          guestCount: 150 + i * 10,
          totalBudget: 300000 + i * 10000,
          language: "en",
        };
        promises.push(createNewEvent(input, `user-concurrency-${i}`));
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(15);

      const ids = new Set<string>();
      for (const plan of results) {
        expect(ids.has(plan.event.id)).toBe(false); // All IDs must be strictly unique
        ids.add(plan.event.id);
        createdEventIds.push(plan.event.id);

        // Verify disk file exists and is valid JSON
        const filePath = path.join(eventsDir, `${plan.event.id}.json`);
        expect(fs.existsSync(filePath)).toBe(true);
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as FullEventPlan;
        expect(parsed.event.id).toBe(plan.event.id);
        expect(parsed.event.title).toBe(plan.event.title);
      }
      expect(ids.size).toBe(15);
    });

    it("handles 10 concurrent mutation requests to the SAME event without crashing or file corruption", async () => {
      const basePlan = await createNewEvent({
        title: "Race Condition Stress Event",
        eventType: "community",
        eventDate: "2027-09-01",
        city: "Mumbai",
        guestCount: 200,
        totalBudget: 400000,
        language: "en",
      });
      createdEventIds.push(basePlan.event.id);
      const eventId = basePlan.event.id;

      const validCategories: BudgetCategory[] = [
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
      ];

      // Launch 10 simultaneous budget additions to this event with strictly valid schema properties
      const mutationPromises: Promise<Response>[] = [];
      for (let i = 0; i < 10; i++) {
        const req = createMockRequest(`/api/events/${eventId}/budget`, "POST", {
          category: validCategories[i % validCategories.length],
          name: `Concurrent Item ${i}`,
          estimatedAmount: 5000 + i * 500,
          actualAmount: 4000,
          status: "planned",
        });
        mutationPromises.push(postBudget(req, { params: Promise.resolve({ id: eventId }) }));
      }

      const mutationResponses = await Promise.all(mutationPromises);
      for (const res of mutationResponses) {
        expect(res.status).toBe(200);
      }

      // Check final state
      const finalPlan = getEventPlan(eventId);
      expect(finalPlan).not.toBeNull();
      // Ensure the backing file on disk is valid JSON
      const diskPath = path.join(eventsDir, `${eventId}.json`);
      expect(fs.existsSync(diskPath)).toBe(true);
      const rawContent = fs.readFileSync(diskPath, "utf-8");
      expect(() => JSON.parse(rawContent)).not.toThrow();
    });

    it("guarantees storage reload resilience when in-memory cache is purged (cold restart simulation)", async () => {
      const plan = await createNewEvent({
        title: "Cold Start Rehydration Event",
        eventType: "anniversary",
        eventDate: "2027-10-20",
        city: "Delhi",
        guestCount: 80,
        totalBudget: 150000,
        language: "en",
      });
      createdEventIds.push(plan.event.id);
      const eventId = plan.event.id;

      // Verify it exists in memoryStore
      expect(globalThis.__utsavmate_events?.has(eventId)).toBe(true);

      // SIMULATE SERVERLESS COLD RESTART: Purge in-memory Map
      globalThis.__utsavmate_events?.clear();
      expect(globalThis.__utsavmate_events?.size).toBe(0);

      // 1. getEventPlan should reload from disk file, rehydrate schema, and repopulate memoryStore
      const reloadedPlan = getEventPlan(eventId);
      expect(reloadedPlan).not.toBeNull();
      expect(reloadedPlan?.event.title).toBe("Cold Start Rehydration Event");
      expect(reloadedPlan?.event.city).toBe("Delhi");
      expect(globalThis.__utsavmate_events?.has(eventId)).toBe(true);

      // 2. Clear memory again and test listEvents directory scan
      globalThis.__utsavmate_events?.clear();
      const allEvents = listEvents();
      expect(allEvents.length).toBeGreaterThan(0);
      const rehydratedSummary = allEvents.find((e) => e.id === eventId);
      expect(rehydratedSummary).toBeDefined();
      expect(rehydratedSummary?.title).toBe("Cold Start Rehydration Event");
    });

    it("survives corrupt, partial, and malformed files in the events directory gracefully", () => {
      const corruptFile1 = path.join(eventsDir, "event-corrupt-empty.json");
      const corruptFile2 = path.join(eventsDir, "event-corrupt-syntax.json");
      const corruptFile3 = path.join(eventsDir, "event-corrupt-schema.json");

      try {
        // 1. Zero-byte file
        fs.writeFileSync(corruptFile1, "", "utf-8");
        // 2. Half-written syntax error
        fs.writeFileSync(corruptFile2, '{"event": {"id": "truncated', "utf-8");
        // 3. Valid JSON but violates schema
        fs.writeFileSync(corruptFile3, JSON.stringify({ notAnEvent: 123 }), "utf-8");

        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        // listEvents should skip all 3 corrupt files without crashing
        let events: FullEventPlan["event"][] = [];
        expect(() => {
          events = listEvents();
        }).not.toThrow();

        expect(Array.isArray(events)).toBe(true);
        expect(warnSpy).toHaveBeenCalled();

        // getEventPlan on corrupt file should return null without crashing
        expect(getEventPlan("event-corrupt-syntax")).toBeNull();
        expect(getEventPlan("event-corrupt-schema")).toBeNull();

        warnSpy.mockRestore();
      } finally {
        if (fs.existsSync(corruptFile1)) fs.unlinkSync(corruptFile1);
        if (fs.existsSync(corruptFile2)) fs.unlinkSync(corruptFile2);
        if (fs.existsSync(corruptFile3)) fs.unlinkSync(corruptFile3);
      }
    });

    it("verifies temporary file cleanup on atomic write failure", () => {
      const plan: FullEventPlan = {
        event: {
          id: "evt-temp-cleanup-test",
          userId: "default-user",
          title: "Temp Cleanup Test",
          eventType: "wedding",
          eventDate: "2027-11-11",
          city: "Jaipur",
          guestCount: 100,
          totalBudget: 100000,
          currency: "INR",
          language: "en",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        budget: [],
        tasks: [],
        vendors: [],
        ideas: [],
        aiGenerated: false,
        aiProvider: "deterministic_fallback",
        version: 1,
      };

      // Mock renameSync to fail
      const renameSpy = vi.spyOn(fs, "renameSync").mockImplementation(() => {
        throw new Error("EACCES: permission denied, rename");
      });
      const unlinkSpy = vi.spyOn(fs, "unlinkSync");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      expect(() => saveEventPlan(plan)).not.toThrow();

      // Verify unlinkSync was called to clean up the .tmp file
      expect(unlinkSpy).toHaveBeenCalledWith(expect.stringContaining(".tmp."));

      renameSpy.mockRestore();
      unlinkSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // SECTION 3: Edge Cases & Input Validation
  // -------------------------------------------------------------------------
  describe("3. Adversarial Edge Cases & Boundary Conditions", () => {
    it("handles extreme budget amounts and guest counts safely", async () => {
      // Very high budget (₹100 Crore) and guest count (50,000)
      const megaEvent = await createNewEvent({
        title: "Mega Cultural Kumbh Celebration",
        eventType: "community",
        eventDate: "2028-01-15",
        city: "Prayagraj",
        guestCount: 50000,
        totalBudget: 100000000,
        language: "hi",
      });
      createdEventIds.push(megaEvent.event.id);

      expect(megaEvent.event.totalBudget).toBe(100000000);
      expect(megaEvent.event.guestCount).toBe(50000);
      expect(megaEvent.budget.length).toBeGreaterThan(0);

      // Verify export formatting doesn't overflow or produce NaN
      const req = createMockRequest(`/api/events/${megaEvent.event.id}/export?format=markdown`, "GET");
      const res = await getExport(req, { params: Promise.resolve({ id: megaEvent.event.id }) });
      expect(res.status).toBe(200);
      const md = await res.text();
      expect(md).toContain("₹");
      expect(md).not.toContain("NaN");
      expect(md).not.toContain("undefined");
    });

    it("rejects invalid event ID parameters (empty or whitespace) across all route handlers with HTTP 400", async () => {
      const invalidIds = ["", "   ", "\t\n"];
      for (const badId of invalidIds) {
        // GET event
        const getRes = await getEvent(createMockRequest(`/api/events/${encodeURIComponent(badId)}`, "GET"), {
          params: Promise.resolve({ id: badId }),
        });
        expect(getRes.status).toBe(400);

        // POST budget
        const budgetRes = await postBudget(createMockRequest(`/api/events/${encodeURIComponent(badId)}/budget`, "POST", {
          category: "decor",
          name: "Item",
          estimatedAmount: 100,
        }), {
          params: Promise.resolve({ id: badId }),
        });
        expect(budgetRes.status).toBe(400);

        // POST tasks
        const taskRes = await postTasks(createMockRequest(`/api/events/${encodeURIComponent(badId)}/tasks`, "POST", {
          title: "Task",
          category: "decor",
          dueDate: "2027-01-01",
        }), {
          params: Promise.resolve({ id: badId }),
        });
        expect(taskRes.status).toBe(400);

        // POST vendors
        const vendorRes = await postVendors(createMockRequest(`/api/events/${encodeURIComponent(badId)}/vendors`, "POST", {
          category: "decor",
          businessName: "Vendor",
        }), {
          params: Promise.resolve({ id: badId }),
        });
        expect(vendorRes.status).toBe(400);

        // POST refine
        const refineRes = await postRefine(createMockRequest(`/api/events/${encodeURIComponent(badId)}/refine`, "POST", {
          prompt: "test",
        }), {
          params: Promise.resolve({ id: badId }),
        });
        expect(refineRes.status).toBe(400);

        // GET export
        const exportRes = await getExport(createMockRequest(`/api/events/${encodeURIComponent(badId)}/export`, "GET"), {
          params: Promise.resolve({ id: badId }),
        });
        expect(exportRes.status).toBe(400);
      }
    });

    it("returns HTTP 404 cleanly when targeting non-existent event IDs", async () => {
      const nonExistentId = "event-nonexistent-99999";

      const getRes = await getEvent(createMockRequest(`/api/events/${nonExistentId}`, "GET"), {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(getRes.status).toBe(404);

      const budgetRes = await postBudget(createMockRequest(`/api/events/${nonExistentId}/budget`, "POST", {
        category: "venue",
        name: "Test",
        estimatedAmount: 500,
      }), {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(budgetRes.status).toBe(404);

      const refineRes = await postRefine(createMockRequest(`/api/events/${nonExistentId}/refine`, "POST", {
        prompt: "Cut budget",
      }), {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(refineRes.status).toBe(404);

      const exportRes = await getExport(createMockRequest(`/api/events/${nonExistentId}/export`, "GET"), {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(exportRes.status).toBe(404);
    });
  });
});
