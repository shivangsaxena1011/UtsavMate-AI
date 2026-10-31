import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { useEventWorkspace, TabType } from "../src/hooks/useEventWorkspace";
import { FullEventPlan, BudgetItem, TimelineTask, Vendor } from "../src/lib/types";

// Zero-dependency empirical Hook Runner for React 19 testing in Node
interface HookRunner<T> {
  current: T;
  rerender: () => void;
  cleanup: () => void;
  waitFor: (predicate: (state: T) => boolean, timeoutMs?: number) => Promise<void>;
}

function createHookRunner<T>(hookFn: () => T): HookRunner<T> {
  const stateSlots: unknown[] = [];
  const effectSlots: {
    fn: () => void | (() => void);
    deps: unknown[] | undefined;
    cleanup: (() => void) | undefined;
    hasRun: boolean;
  }[] = [];
  const callbackSlots: { fn: (...args: unknown[]) => unknown; deps: unknown[] | undefined }[] = [];

  let stateIndex = 0;
  let effectIndex = 0;
  let callbackIndex = 0;

  let result: T;
  let isRerendering = false;

  const dispatcher = {
    useState<S>(initial: S | (() => S)): [S, (action: S | ((prev: S) => S)) => void] {
      const idx = stateIndex++;
      if (stateSlots.length <= idx) {
        const val = typeof initial === "function" ? (initial as () => S)() : initial;
        stateSlots.push(val);
      }
      const setState = (action: S | ((prev: S) => S)) => {
        const prevVal = stateSlots[idx] as S;
        const nextVal = typeof action === "function" ? (action as (p: S) => S)(prevVal) : action;
        stateSlots[idx] = nextVal;
        if (!isRerendering) {
          rerender();
        }
      };
      return [stateSlots[idx] as S, setState];
    },
    useEffect(fn: () => void | (() => void), deps?: unknown[]) {
      const idx = effectIndex++;
      if (effectSlots.length <= idx) {
        effectSlots.push({ fn, deps, cleanup: undefined, hasRun: false });
      } else {
        const prev = effectSlots[idx];
        const changed =
          !deps ||
          !prev.deps ||
          deps.length !== prev.deps.length ||
          deps.some((d, i) => !Object.is(d, prev.deps![i]));
        if (changed) {
          if (typeof prev.cleanup === "function") prev.cleanup();
          effectSlots[idx] = { fn, deps, cleanup: undefined, hasRun: false };
        }
      }
    },
    useCallback<F extends (...args: unknown[]) => unknown>(fn: F, deps: unknown[]): F {
      const idx = callbackIndex++;
      if (callbackSlots.length <= idx) {
        callbackSlots.push({ fn, deps });
        return fn;
      }
      const prev = callbackSlots[idx];
      const changed =
        !deps ||
        !prev.deps ||
        deps.length !== prev.deps.length ||
        deps.some((d, i) => !Object.is(d, prev.deps![i]));
      if (changed) {
        callbackSlots[idx] = { fn, deps };
        return fn;
      }
      return prev.fn as F;
    },
  };

  function rerender() {
    isRerendering = true;
    stateIndex = 0;
    effectIndex = 0;
    callbackIndex = 0;

    // Set React 19 Current Dispatcher
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = dispatcher;
    try {
      result = hookFn();
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H = null;
      isRerendering = false;
    }

    // Run pending effects
    for (const ef of effectSlots) {
      if (!ef.hasRun) {
        ef.hasRun = true;
        const cl = ef.fn();
        if (typeof cl === "function") ef.cleanup = cl;
      }
    }
  }

  rerender();

  return {
    get current() {
      return result;
    },
    rerender,
    cleanup() {
      for (const ef of effectSlots) {
        if (typeof ef.cleanup === "function") {
          ef.cleanup();
          ef.cleanup = undefined;
        }
      }
    },
    async waitFor(predicate: (state: T) => boolean, timeoutMs = 1500): Promise<void> {
      const start = Date.now();
      while (!predicate(result)) {
        if (Date.now() - start > timeoutMs) {
          throw new Error(`Timeout waiting for hook predicate after ${timeoutMs}ms`);
        }
        await new Promise((r) => setTimeout(r, 10));
      }
    },
  };
}

function createMockPlan(id = "evt-test-1"): FullEventPlan {
  return {
    event: {
      id,
      userId: "user-1",
      title: "Test Celebration Gala",
      eventType: "wedding",
      eventDate: "2027-10-15",
      city: "Delhi",
      guestCount: 100,
      totalBudget: 100000,
      currency: "INR",
      language: "en",
      createdAt: "2026-10-31T00:00:00.000Z",
      updatedAt: "2026-10-31T00:00:00.000Z",
    },
    budget: [
      {
        id: "bgt-1",
        eventId: id,
        category: "venue",
        name: "Hall Rental",
        estimatedAmount: 40000,
        actualAmount: 38000,
        status: "planned",
      },
      {
        id: "bgt-2",
        eventId: id,
        category: "catering",
        name: "Buffet Dinner",
        estimatedAmount: 30000,
        actualAmount: 30000,
        status: "booked",
      },
    ],
    tasks: [
      {
        id: "tsk-1",
        eventId: id,
        title: "Book Pandit",
        description: "Priest booking",
        category: "General",
        dueDate: "2027-09-01",
        priority: "high",
        status: "pending",
        isOverdue: false,
      },
      {
        id: "tsk-2",
        eventId: id,
        title: "Select Invitations",
        description: "Cards",
        category: "Design",
        dueDate: "2025-01-01",
        priority: "medium",
        status: "pending",
        isOverdue: true,
      },
      {
        id: "tsk-3",
        eventId: id,
        title: "Buy Favors",
        description: "Sweets",
        category: "Gifts",
        dueDate: "2027-10-01",
        priority: "low",
        status: "completed",
        isOverdue: false,
      },
    ],
    vendors: [
      {
        id: "vnd-1",
        eventId: id,
        category: "Venue",
        businessName: "Royal Palace",
        estimatedQuote: 45000,
        finalQuote: 40000,
        status: "contacted",
      },
      {
        id: "vnd-2",
        eventId: id,
        category: "Catering",
        businessName: "Spice Garden",
        estimatedQuote: 30000,
        finalQuote: 0,
        status: "not_contacted",
      },
      {
        id: "vnd-3",
        eventId: id,
        category: "Decor",
        businessName: "Floral Magic",
        estimatedQuote: 15000,
        finalQuote: 12000,
        status: "booked",
      },
    ],
    ideas: [
      {
        id: "idea-1",
        eventId: id,
        section: "decor",
        title: "Marigold Theme",
        description: "Traditional garland decor",
        costTier: "$",
      },
      {
        id: "idea-2",
        eventId: id,
        section: "food",
        title: "Live Chaat Counter",
        description: "Street food station",
        costTier: "$$",
      },
      {
        id: "idea-3",
        eventId: id,
        section: "activity",
        title: "Dhol Entry",
        description: "Grand entrance",
        costTier: "$",
      },
      {
        id: "idea-4",
        eventId: id,
        section: "saving",
        title: "Digital Invites",
        description: "Save printing costs",
        costTier: "$",
      },
    ],
    aiGenerated: true,
    aiProvider: "gemini",
    version: 1,
  };
}

describe("Empirical Stress-Test: useEventWorkspace", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalWindow: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let originalFetch: any;
  let mockHashListeners: ((event?: Event) => void)[] = [];
  let currentHash = "";

  beforeEach(() => {
    mockHashListeners = [];
    currentHash = "";
    originalWindow = global.window;
    originalFetch = global.fetch;

    // Setup mock browser window environment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {
      location: {
        get hash() {
          return currentHash;
        },
        set hash(val: string) {
          currentHash = val;
        },
      },
      history: {
        replaceState: vi.fn((_state, _title, url: string) => {
          currentHash = url;
        }),
      },
      addEventListener: vi.fn((event: string, handler: (e?: Event) => void) => {
        if (event === "hashchange") {
          mockHashListeners.push(handler);
        }
      }),
      removeEventListener: vi.fn((event: string, handler: (e?: Event) => void) => {
        if (event === "hashchange") {
          mockHashListeners = mockHashListeners.filter((h) => h !== handler);
        }
      }),
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("1. Initialization, Data Loading & Route ID Resilience", () => {
    it("initializes with loading state and loads full plan successfully", async () => {
      const mockPlan = createMockPlan("evt-100");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-100"));

      // Initial state checks
      expect(runner.current.loading).toBe(true);
      expect(runner.current.plan).toBeNull();
      expect(runner.current.error).toBeNull();
      expect(runner.current.activeTab).toBe("overview");

      // Wait for fetch completion
      await runner.waitFor((s) => !s.loading);

      expect(runner.current.loading).toBe(false);
      expect(runner.current.plan).not.toBeNull();
      expect(runner.current.plan?.event.title).toBe("Test Celebration Gala");
      expect(runner.current.error).toBeNull();

      // Verify derived metrics calculations
      expect(runner.current.summary).not.toBeNull();
      expect(runner.current.summary?.totalBudget).toBe(100000);
      expect(runner.current.summary?.totalEstimated).toBe(70000);
      expect(runner.current.completedTasks).toBe(1);
      expect(runner.current.overdueTasks).toBe(1);
      expect(runner.current.filteredTasks).toHaveLength(3);
      expect(runner.current.filteredVendors).toHaveLength(3);
      expect(runner.current.filteredIdeas).toHaveLength(4);

      runner.cleanup();
    });

    it("safely handles 404 Event Not Found without throwing uncaught exceptions", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: "Event not found" }),
      });

      const runner = createHookRunner(() => useEventWorkspace("non-existent-id"));

      await runner.waitFor((s) => !s.loading);

      expect(runner.current.loading).toBe(false);
      expect(runner.current.plan).toBeNull();
      expect(runner.current.error).toBe("Event not found");

      runner.cleanup();
    });

    it("safely handles 500 server crash without breaking React state machine", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: "Internal Server Error" }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-crash"));

      await runner.waitFor((s) => !s.loading);

      expect(runner.current.loading).toBe(false);
      expect(runner.current.plan).toBeNull();
      expect(runner.current.error).toBe("Internal Server Error");

      runner.cleanup();
    });

    it("safely handles network exceptions (e.g. offline/fetch abort)", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network connection lost"));

      const runner = createHookRunner(() => useEventWorkspace("evt-net"));

      await runner.waitFor((s) => !s.loading);

      expect(runner.current.loading).toBe(false);
      expect(runner.current.plan).toBeNull();
      expect(runner.current.error).toBe("Network connection lost");

      runner.cleanup();
    });

    it("does not trigger network fetch or throw exceptions when eventId is empty string", () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      const runner = createHookRunner(() => useEventWorkspace(""));

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(runner.current.plan).toBeNull();

      runner.cleanup();
    });
  });

  describe("2. Tab Navigation & Hash Synchronization", () => {
    it("switches active tabs and updates browser URL hash", async () => {
      const mockPlan = createMockPlan("evt-tabs");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-tabs"));
      await runner.waitFor((s) => !s.loading);

      const tabsToTest: TabType[] = ["budget", "timeline", "vendors", "ai", "export", "overview"];

      for (const tab of tabsToTest) {
        runner.current.switchTab(tab);
        expect(runner.current.activeTab).toBe(tab);
        expect(window.history.replaceState).toHaveBeenCalledWith(null, "", `#${tab}`);
      }

      runner.cleanup();
    });

    it("syncs active tab when browser hashchange event is triggered", async () => {
      const mockPlan = createMockPlan("evt-hash");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-hash"));
      await runner.waitFor((s) => !s.loading);

      // Trigger hashchange listener to #vendors
      currentHash = "#vendors";
      mockHashListeners.forEach((h) => h());

      expect(runner.current.activeTab).toBe("vendors");

      // Trigger hashchange listener with invalid hash (should be ignored)
      currentHash = "#malicious_unknown_tab";
      mockHashListeners.forEach((h) => h());

      // activeTab remains vendors
      expect(runner.current.activeTab).toBe("vendors");

      runner.cleanup();
    });
  });

  describe("3. Modal State Toggling & Form Controls", () => {
    it("toggles all 3 modal dialogs and maintains form input bindings", async () => {
      const mockPlan = createMockPlan("evt-modals");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-modals"));
      await runner.waitFor((s) => !s.loading);

      // Budget Modal
      expect(runner.current.isBudgetModalOpen).toBe(false);
      runner.current.setIsBudgetModalOpen(true);
      expect(runner.current.isBudgetModalOpen).toBe(true);
      runner.current.setNewBudgetItem({ name: "Stage Lighting", estimatedAmount: 12000 });
      expect(runner.current.newBudgetItem.name).toBe("Stage Lighting");
      expect(runner.current.newBudgetItem.estimatedAmount).toBe(12000);
      runner.current.setIsBudgetModalOpen(false);
      expect(runner.current.isBudgetModalOpen).toBe(false);

      // Task Modal
      expect(runner.current.isTaskModalOpen).toBe(false);
      runner.current.setIsTaskModalOpen(true);
      expect(runner.current.isTaskModalOpen).toBe(true);
      runner.current.setNewTask({ title: "Order Cake", priority: "high" });
      expect(runner.current.newTask.title).toBe("Order Cake");
      expect(runner.current.newTask.priority).toBe("high");
      runner.current.setIsTaskModalOpen(false);
      expect(runner.current.isTaskModalOpen).toBe(false);

      // Vendor Modal
      expect(runner.current.isVendorModalOpen).toBe(false);
      runner.current.setIsVendorModalOpen(true);
      expect(runner.current.isVendorModalOpen).toBe(true);
      runner.current.setNewVendor({ businessName: "Delhi Sound Works", estimatedQuote: 25000 });
      expect(runner.current.newVendor.businessName).toBe("Delhi Sound Works");
      expect(runner.current.newVendor.estimatedQuote).toBe(25000);
      runner.current.setIsVendorModalOpen(false);
      expect(runner.current.isVendorModalOpen).toBe(false);

      runner.cleanup();
    });
  });

  describe("4. Filter Set Logic & Derived Calculations", () => {
    it("filters tasks correctly across Pending, Completed, Overdue, and All Tasks", async () => {
      const mockPlan = createMockPlan("evt-filters");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-filters"));
      await runner.waitFor((s) => !s.loading);

      // Initial is "All Tasks"
      expect(runner.current.filteredTasks).toHaveLength(3);

      // Pending
      runner.current.setTaskFilter("Pending");
      expect(runner.current.filteredTasks).toHaveLength(2);
      expect(runner.current.filteredTasks.every((t) => t.status !== "completed")).toBe(true);

      // Completed
      runner.current.setTaskFilter("Completed");
      expect(runner.current.filteredTasks).toHaveLength(1);
      expect(runner.current.filteredTasks[0].id).toBe("tsk-3");

      // Overdue
      runner.current.setTaskFilter("Overdue");
      expect(runner.current.filteredTasks).toHaveLength(1);
      expect(runner.current.filteredTasks[0].id).toBe("tsk-2");

      runner.cleanup();
    });

    it("filters vendors by category including 'More' bucket", async () => {
      const mockPlan = createMockPlan("evt-vendor-filters");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-vendor-filters"));
      await runner.waitFor((s) => !s.loading);

      // Category "Venue"
      runner.current.setVendorFilter("Venue");
      expect(runner.current.filteredVendors).toHaveLength(1);
      expect(runner.current.filteredVendors[0].businessName).toBe("Royal Palace");

      // Category "Catering"
      runner.current.setVendorFilter("Catering");
      expect(runner.current.filteredVendors).toHaveLength(1);
      expect(runner.current.filteredVendors[0].businessName).toBe("Spice Garden");

      // Category "All"
      runner.current.setVendorFilter("All");
      expect(runner.current.filteredVendors).toHaveLength(3);

      runner.cleanup();
    });

    it("filters AI ideas by sections correctly", async () => {
      const mockPlan = createMockPlan("evt-idea-filters");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-idea-filters"));
      await runner.waitFor((s) => !s.loading);

      // Decoration
      runner.current.setIdeaFilter("Decoration");
      expect(runner.current.filteredIdeas).toHaveLength(1);
      expect(runner.current.filteredIdeas[0].title).toBe("Marigold Theme");

      // Food & Menu
      runner.current.setIdeaFilter("Food & Menu");
      expect(runner.current.filteredIdeas).toHaveLength(1);
      expect(runner.current.filteredIdeas[0].title).toBe("Live Chaat Counter");

      // Activities
      runner.current.setIdeaFilter("Activities");
      expect(runner.current.filteredIdeas).toHaveLength(1);
      expect(runner.current.filteredIdeas[0].title).toBe("Dhol Entry");

      // Saving Tips
      runner.current.setIdeaFilter("Saving Tips");
      expect(runner.current.filteredIdeas).toHaveLength(1);
      expect(runner.current.filteredIdeas[0].title).toBe("Digital Invites");

      runner.cleanup();
    });
  });

  describe("5. Async Mutation Actions & Error Resilience", () => {
    it("handles handleToggleTask optimistically and persists via API", async () => {
      const mockPlan = createMockPlan("evt-mut-1");
      let postBody: unknown = null;

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "POST" && url.includes("/tasks")) {
          postBody = JSON.parse(opts.body as string);
          return { ok: true, json: async () => ({ success: true, tasks: [] }) };
        }
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-1"));
      await runner.waitFor((s) => !s.loading);

      // Toggle pending task 'tsk-1' -> completed
      await runner.current.handleToggleTask("tsk-1");

      const updatedTask = runner.current.plan?.tasks.find((t) => t.id === "tsk-1");
      expect(updatedTask?.status).toBe("completed");
      expect(postBody).toMatchObject({ id: "tsk-1", status: "completed" });

      runner.cleanup();
    });

    it("rolls back handleToggleTask on server error via fetchPlan", async () => {
      const mockPlan = createMockPlan("evt-mut-2");

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "POST" && url.includes("/tasks")) {
          // Server fails
          return { ok: false, status: 500, json: async () => ({ success: false }) };
        }
        // Refetch succeeds with original plan
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-2"));
      await runner.waitFor((s) => !s.loading);

      await runner.current.handleToggleTask("tsk-1");

      // Verify task reverted to pending
      const task = runner.current.plan?.tasks.find((t) => t.id === "tsk-1");
      expect(task?.status).toBe("pending");

      runner.cleanup();
    });

    it("handles handleAddBudgetItem: updates state, closes modal, and resets form", async () => {
      const mockPlan = createMockPlan("evt-mut-3");
      const newItem: BudgetItem = {
        id: "bgt-3",
        eventId: "evt-mut-3",
        category: "decor",
        name: "Stage Flowers",
        estimatedAmount: 18000,
        actualAmount: 0,
        status: "planned",
      };

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "POST" && url.includes("/budget")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              budget: [...mockPlan.budget, newItem],
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-3"));
      await runner.waitFor((s) => !s.loading);

      runner.current.setIsBudgetModalOpen(true);
      await runner.current.handleAddBudgetItem(newItem);

      expect(runner.current.plan?.budget).toHaveLength(3);
      expect(runner.current.isBudgetModalOpen).toBe(false);
      expect(runner.current.newBudgetItem.name).toBe("");

      runner.cleanup();
    });

    it("handles handleAddTask: updates state, closes modal, and resets form", async () => {
      const mockPlan = createMockPlan("evt-mut-4");
      const newTaskItem: TimelineTask = {
        id: "tsk-4",
        eventId: "evt-mut-4",
        title: "Arrange Welcome Drinks",
        description: "",
        category: "General",
        dueDate: "2027-10-10",
        priority: "medium",
        status: "pending",
      };

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "POST" && url.includes("/tasks")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              tasks: [...mockPlan.tasks, newTaskItem],
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-4"));
      await runner.waitFor((s) => !s.loading);

      runner.current.setIsTaskModalOpen(true);
      await runner.current.handleAddTask(newTaskItem);

      expect(runner.current.plan?.tasks).toHaveLength(4);
      expect(runner.current.isTaskModalOpen).toBe(false);
      expect(runner.current.newTask.title).toBe("");

      runner.cleanup();
    });

    it("handles handleUpdateVendorStatus: updates status and sends POST", async () => {
      const mockPlan = createMockPlan("evt-mut-5");
      let postedVendor: unknown = null;

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "POST" && url.includes("/vendors")) {
          postedVendor = JSON.parse(opts.body as string);
          return { ok: true, json: async () => ({ success: true, vendors: [] }) };
        }
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-5"));
      await runner.waitFor((s) => !s.loading);

      await runner.current.handleUpdateVendorStatus("vnd-2", "booked");

      const vendor = runner.current.plan?.vendors.find((v) => v.id === "vnd-2");
      expect(vendor?.status).toBe("booked");
      expect(postedVendor).toMatchObject({ id: "vnd-2", status: "booked" });

      runner.cleanup();
    });

    it("safely ignores handleUpdateVendorStatus when vendorId is not found", async () => {
      const mockPlan = createMockPlan("evt-mut-6");
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });
      global.fetch = fetchSpy;

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-6"));
      await runner.waitFor((s) => !s.loading);

      const callCountBefore = fetchSpy.mock.calls.length;
      await runner.current.handleUpdateVendorStatus("non-existent-vendor-id", "booked");

      // Should not initiate POST fetch
      expect(fetchSpy.mock.calls.length).toBe(callCountCount(callCountBefore));

      runner.cleanup();
    });

    it("handles handleAddVendor: updates state, closes modal, and resets form", async () => {
      const mockPlan = createMockPlan("evt-mut-7");
      const newVendorItem: Vendor = {
        id: "vnd-4",
        eventId: "evt-mut-7",
        category: "Photography",
        businessName: "Lense & Moments",
        estimatedQuote: 50000,
        finalQuote: 45000,
        status: "contacted",
      };

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "POST" && url.includes("/vendors")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              vendors: [...mockPlan.vendors, newVendorItem],
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-7"));
      await runner.waitFor((s) => !s.loading);

      runner.current.setIsVendorModalOpen(true);
      await runner.current.handleAddVendor(newVendorItem);

      expect(runner.current.plan?.vendors).toHaveLength(4);
      expect(runner.current.isVendorModalOpen).toBe(false);
      expect(runner.current.newVendor.businessName).toBe("");

      runner.cleanup();
    });

    it("handles handleSaveNotes: sends PATCH and updates event record", async () => {
      const mockPlan = createMockPlan("evt-mut-8");
      let patchBody: unknown = null;

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "PATCH") {
          patchBody = JSON.parse(opts.body as string);
          const updatedPlan = {
            ...mockPlan,
            event: { ...mockPlan.event, notes: "All payments cleared" },
          };
          return { ok: true, json: async () => ({ success: true, plan: updatedPlan }) };
        }
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-8"));
      await runner.waitFor((s) => !s.loading);

      await runner.current.handleSaveNotes("All payments cleared");

      expect(patchBody).toEqual({ notes: "All payments cleared" });
      expect(runner.current.plan?.event.notes).toBe("All payments cleared");

      runner.cleanup();
    });

    it("handles handleRefineSubmit: manages chat loading state and updates response", async () => {
      const mockPlan = createMockPlan("evt-mut-9");

      global.fetch = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (opts?.method === "POST" && url.includes("/refine")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              answer: "Here is a suggestion for a vibrant sangeet night.",
              suggestedAction: { type: "add_idea", payload: { title: "Bollywood Flashmob" } },
              source: "gemini",
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true, plan: mockPlan }) };
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-mut-9"));
      await runner.waitFor((s) => !s.loading);

      expect(runner.current.chatLoading).toBe(false);
      expect(runner.current.chatResponse).toBeNull();

      await runner.current.handleRefineSubmit("Suggest ideas for sangeet");

      expect(runner.current.chatLoading).toBe(false);
      expect(runner.current.chatResponse?.answer).toContain("vibrant sangeet");
      expect(runner.current.chatResponse?.source).toBe("gemini");

      runner.cleanup();
    });
  });

  describe("6. Lifecycle, Cleanup & Teardown", () => {
    it("deregisters hashchange event listener when unmounted", async () => {
      const mockPlan = createMockPlan("evt-clean");
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, plan: mockPlan }),
      });

      const runner = createHookRunner(() => useEventWorkspace("evt-clean"));
      await runner.waitFor((s) => !s.loading);

      expect(mockHashListeners).toHaveLength(1);

      runner.cleanup();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        "hashchange",
        expect.any(Function)
      );
      expect(mockHashListeners).toHaveLength(0);
    });
  });
});

function callCountCount(val: number): number {
  return val;
}
