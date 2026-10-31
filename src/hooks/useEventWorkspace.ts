"use client";

/**
 * @file useEventWorkspace.ts
 * @module hooks/useEventWorkspace
 * @description Custom React hook managing the event workspace dashboard state, tab navigation,
 * filtering, derived financial calculations, modal visibility, and asynchronous mutation handlers.
 * Implements strict runtime type guards, resilient error handling via actionError state,
 * and optimistic UI updates with automatic recovery.
 */

import { useCallback, useEffect, useState } from "react";
import {
  FullEventPlan,
  BudgetItem,
  TimelineTask,
  Vendor,
  BudgetSummary,
  PersonalizedIdea,
  VendorStatus,
} from "@/lib/types";
import { computeBudgetSummary } from "@/lib/engines/budget";

/**
 * Valid workspace navigation tab identifiers.
 */
export type TabType = "overview" | "budget" | "timeline" | "vendors" | "ai" | "export";

/**
 * Valid filter states for the timeline task roadmap.
 */
export type TaskFilterType = "All Tasks" | "Pending" | "Completed" | "Overdue";

/**
 * Type guard function to verify whether a string is a valid TabType union member without type casting.
 *
 * @param val - Candidate string to check
 * @returns True if val is a valid TabType
 */
export function isTabType(val: string): val is TabType {
  return (
    val === "overview" ||
    val === "budget" ||
    val === "timeline" ||
    val === "vendors" ||
    val === "ai" ||
    val === "export"
  );
}

/**
 * State object returned from AI refine interactions.
 */
export interface ChatResponseState {
  answer: string;
  suggestedAction?: { type: string; payload?: Record<string, unknown> };
  source: string;
}

/**
 * Return signature of the useEventWorkspace hook.
 */
export interface UseEventWorkspaceResult {
  plan: FullEventPlan | null;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  clearActionError: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  switchTab: (tab: TabType) => void;

  // Filter States
  taskFilter: TaskFilterType;
  setTaskFilter: (filter: TaskFilterType) => void;
  vendorFilter: string;
  setVendorFilter: (filter: string) => void;
  ideaFilter: string;
  setIdeaFilter: (filter: string) => void;

  // Derived Calculations
  summary: BudgetSummary | null;
  completedTasks: number;
  overdueTasks: number;
  filteredTasks: TimelineTask[];
  filteredVendors: Vendor[];
  filteredIdeas: PersonalizedIdea[];

  // Modals Visibility
  isBudgetModalOpen: boolean;
  setIsBudgetModalOpen: (open: boolean) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  isVendorModalOpen: boolean;
  setIsVendorModalOpen: (open: boolean) => void;

  // Form Inputs
  newBudgetItem: Partial<BudgetItem>;
  setNewBudgetItem: React.Dispatch<React.SetStateAction<Partial<BudgetItem>>>;
  newTask: Partial<TimelineTask>;
  setNewTask: React.Dispatch<React.SetStateAction<Partial<TimelineTask>>>;
  newVendor: Partial<Vendor>;
  setNewVendor: React.Dispatch<React.SetStateAction<Partial<Vendor>>>;

  // AI Chat State
  chatPrompt: string;
  setChatPrompt: (prompt: string) => void;
  chatLoading: boolean;
  chatResponse: ChatResponseState | null;

  // Actions
  refreshPlan: () => Promise<void>;
  handleAddBudgetItem: (item?: Partial<BudgetItem>) => Promise<void>;
  handleUpdateBudgetItem: (item: BudgetItem, changes: Partial<BudgetItem>) => Promise<void>;
  handleDeleteBudgetItem: (itemId: string) => Promise<void>;
  handleToggleTask: (taskOrId: string | TimelineTask) => Promise<void>;
  handleAddTask: (task?: Partial<TimelineTask>) => Promise<void>;
  handleUpdateVendor: (vendor: Vendor, changes: Partial<Vendor>) => Promise<void>;
  handleUpdateVendorStatus: (vendorId: string, status: VendorStatus) => Promise<void>;
  handleAddVendor: (vendor?: Partial<Vendor>) => Promise<void>;
  handleSaveNotes: (notes: string) => Promise<void>;
  handleRefineSubmit: (customPrompt?: string, applyAction?: boolean) => Promise<void>;
}

/**
 * Custom React hook orchestrating workspace state and network mutations for an event.
 *
 * @param eventId - The unique event identifier
 * @returns UseEventWorkspaceResult object containing all state and action handlers
 */
export function useEventWorkspace(eventId: string): UseEventWorkspaceResult {
  const [plan, setPlan] = useState<FullEventPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  // Filters
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>("All Tasks");
  const [vendorFilter, setVendorFilter] = useState<string>("All");
  const [ideaFilter, setIdeaFilter] = useState<string>("All Ideas");

  // Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudgetItem, setNewBudgetItem] = useState<Partial<BudgetItem>>({
    category: "venue",
    name: "",
    estimatedAmount: 0,
    actualAmount: 0,
    status: "planned",
  });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<TimelineTask>>({
    title: "",
    description: "",
    category: "General",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "medium",
    status: "pending",
  });

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    category: "Venue",
    businessName: "",
    estimatedQuote: 0,
    finalQuote: 0,
    status: "not_contacted",
  });

  // AI Chat
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<ChatResponseState | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Event not found");
      setPlan(data.plan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let ignore = false;
    const loadPlan = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (!ignore) {
          if (!res.ok || !data.success) throw new Error(data.error || "Event not found");
          setPlan(data.plan);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Error loading event");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (eventId) {
      void loadPlan();
    }
    return () => {
      ignore = true;
    };
  }, [eventId]);

  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.replace("#", "");
      if (isTabType(rawHash)) {
        setActiveTab(rawHash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }, []);

  // Derived summaries & filtered sets
  const summary: BudgetSummary | null = plan
    ? computeBudgetSummary(plan.budget, plan.event.totalBudget, plan.event.guestCount)
    : null;

  const completedTasks = plan ? plan.tasks.filter((t) => t.status === "completed").length : 0;
  const overdueTasks = plan ? plan.tasks.filter((t) => t.isOverdue && t.status !== "completed").length : 0;

  const filteredTasks = plan
    ? plan.tasks.filter((task) => {
        if (taskFilter === "Pending") return task.status !== "completed";
        if (taskFilter === "Completed") return task.status === "completed";
        if (taskFilter === "Overdue") return task.isOverdue && task.status !== "completed";
        return true;
      })
    : [];

  const filteredVendors = plan
    ? plan.vendors.filter((vendor) => {
        if (vendorFilter === "All") return true;
        if (vendorFilter === "More") {
          return !["Venue", "Catering", "Photography", "Decor"].includes(vendor.category);
        }
        return vendor.category === vendorFilter;
      })
    : [];

  const filteredIdeas = plan
    ? plan.ideas.filter((idea) => {
        if (ideaFilter === "All Ideas") return true;
        if (ideaFilter === "Decoration") return idea.section === "decor";
        if (ideaFilter === "Food & Menu") return idea.section === "food";
        if (ideaFilter === "Activities" || ideaFilter === "activity") return idea.section === "activity";
        if (ideaFilter === "Saving Tips" || ideaFilter === "Cost Savers" || ideaFilter === "saving") return idea.section === "saving";
        if (ideaFilter === "Theme Ideas" || ideaFilter === "Ceremony & Rituals" || ideaFilter === "theme") return idea.section === "theme";
        return true;
      })
    : [];

  // Actions
  const handleToggleTask = useCallback(
    async (taskOrId: string | TimelineTask) => {
      if (!plan || !eventId) return;
      const taskId = typeof taskOrId === "string" ? taskOrId : taskOrId.id;
      const task = plan.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newStatus: TimelineTask["status"] =
        task.status === "completed" ? "pending" : "completed";
      const updated = { ...task, status: newStatus };
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === task.id ? updated : t)),
            }
          : null
      );

      try {
        const res = await fetch(`/api/events/${eventId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const message = errorData.error || "Failed to update task status";
          console.error("[useEventWorkspace:handleToggleTask] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error updating task";
        console.error("[useEventWorkspace:handleToggleTask] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, fetchPlan]
  );

  const handleAddTask = useCallback(
    async (taskData?: Partial<TimelineTask>) => {
      if (!plan || !eventId) return;
      const payload = taskData || newTask;
      try {
        const res = await fetch(`/api/events/${eventId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setPlan((prev) => (prev ? { ...prev, tasks: data.tasks } : null));
          setIsTaskModalOpen(false);
          setNewTask({
            title: "",
            description: "",
            category: "General",
            dueDate: new Date().toISOString().split("T")[0],
            priority: "medium",
            status: "pending",
          });
        } else {
          const message = data.error || "Failed to add task";
          console.error("[useEventWorkspace:handleAddTask] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error adding task";
        console.error("[useEventWorkspace:handleAddTask] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, newTask, fetchPlan]
  );

  const handleUpdateBudgetItem = useCallback(
    async (item: BudgetItem, changes: Partial<BudgetItem>) => {
      if (!plan) return;
      const updated = { ...item, ...changes };
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              budget: prev.budget.map((b) => (b.id === item.id ? updated : b)),
            }
          : null
      );

      try {
        const res = await fetch(`/api/events/${eventId}/budget`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const message = errorData.error || "Failed to update budget item";
          console.error("[useEventWorkspace:handleUpdateBudgetItem] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error updating budget item";
        console.error("[useEventWorkspace:handleUpdateBudgetItem] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, fetchPlan]
  );

  const handleDeleteBudgetItem = useCallback(
    async (itemId: string) => {
      if (!plan) return;
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              budget: prev.budget.filter((b) => b.id !== itemId),
            }
          : null
      );

      try {
        const res = await fetch(`/api/events/${eventId}/budget`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const message = errorData.error || "Failed to delete budget item";
          console.error("[useEventWorkspace:handleDeleteBudgetItem] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error deleting budget item";
        console.error("[useEventWorkspace:handleDeleteBudgetItem] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, fetchPlan]
  );

  const handleAddBudgetItem = useCallback(
    async (itemData?: Partial<BudgetItem>) => {
      if (!plan || !eventId) return;
      const payload = itemData || newBudgetItem;
      try {
        const res = await fetch(`/api/events/${eventId}/budget`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setPlan((prev) => (prev ? { ...prev, budget: data.budget } : null));
          setIsBudgetModalOpen(false);
          setNewBudgetItem({
            category: "venue",
            name: "",
            estimatedAmount: 0,
            actualAmount: 0,
            status: "planned",
          });
        } else {
          const message = data.error || "Failed to add budget item";
          console.error("[useEventWorkspace:handleAddBudgetItem] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error adding budget item";
        console.error("[useEventWorkspace:handleAddBudgetItem] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, newBudgetItem, fetchPlan]
  );

  const handleUpdateVendor = useCallback(
    async (vendor: Vendor, changes: Partial<Vendor>) => {
      if (!plan) return;
      const updated = { ...vendor, ...changes };
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              vendors: prev.vendors.map((v) => (v.id === vendor.id ? updated : v)),
            }
          : null
      );

      try {
        const res = await fetch(`/api/events/${eventId}/vendors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const message = errorData.error || "Failed to update vendor";
          console.error("[useEventWorkspace:handleUpdateVendor] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error updating vendor";
        console.error("[useEventWorkspace:handleUpdateVendor] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, fetchPlan]
  );

  const handleUpdateVendorStatus = useCallback(
    async (vendorId: string, status: VendorStatus) => {
      if (!plan) return;
      const vendor = plan.vendors.find((v) => v.id === vendorId);
      if (!vendor) return;
      await handleUpdateVendor(vendor, { status });
    },
    [plan, handleUpdateVendor]
  );

  const handleAddVendor = useCallback(
    async (vendorData?: Partial<Vendor>) => {
      if (!plan || !eventId) return;
      const payload = vendorData || newVendor;
      try {
        const res = await fetch(`/api/events/${eventId}/vendors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setPlan((prev) => (prev ? { ...prev, vendors: data.vendors } : null));
          setIsVendorModalOpen(false);
          setNewVendor({
            category: "Venue",
            businessName: "",
            estimatedQuote: 0,
            finalQuote: 0,
            status: "not_contacted",
          });
        } else {
          const message = data.error || "Failed to add vendor";
          console.error("[useEventWorkspace:handleAddVendor] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error adding vendor";
        console.error("[useEventWorkspace:handleAddVendor] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, newVendor, fetchPlan]
  );

  const handleSaveNotes = useCallback(
    async (notes: string) => {
      if (!plan || !eventId) return;
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.plan) {
          setPlan(data.plan);
        } else {
          const message = data.error || "Failed to save notes";
          console.error("[useEventWorkspace:handleSaveNotes] Server error:", message);
          setActionError(message);
          await fetchPlan();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error saving notes";
        console.error("[useEventWorkspace:handleSaveNotes] Exception:", message, err);
        setActionError(message);
        await fetchPlan();
      }
    },
    [eventId, plan, fetchPlan]
  );

  const handleRefineSubmit = useCallback(
    async (customPrompt?: string, applyAction = false) => {
      const query = customPrompt || chatPrompt;
      if (!query.trim() || !eventId) return;
      setChatLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}/refine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: query, applyAction }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setChatResponse({
            answer: data.answer,
            suggestedAction: data.suggestedAction,
            source: data.source,
          });
          if (data.updatedPlan) {
            setPlan(data.updatedPlan);
          }
        } else {
          const message = data.error || "Failed to refine plan";
          console.error("[useEventWorkspace:handleRefineSubmit] Server error:", message);
          setActionError(message);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Network error during refine";
        console.error("[useEventWorkspace:handleRefineSubmit] Exception:", message, err);
        setActionError(message);
      } finally {
        setChatLoading(false);
      }
    },
    [eventId, chatPrompt]
  );

  return {
    plan,
    loading,
    error,
    actionError,
    clearActionError,
    activeTab,
    setActiveTab,
    switchTab,
    taskFilter,
    setTaskFilter,
    vendorFilter,
    setVendorFilter,
    ideaFilter,
    setIdeaFilter,
    summary,
    completedTasks,
    overdueTasks,
    filteredTasks,
    filteredVendors,
    filteredIdeas,
    isBudgetModalOpen,
    setIsBudgetModalOpen,
    isTaskModalOpen,
    setIsTaskModalOpen,
    isVendorModalOpen,
    setIsVendorModalOpen,
    newBudgetItem,
    setNewBudgetItem,
    newTask,
    setNewTask,
    newVendor,
    setNewVendor,
    chatPrompt,
    setChatPrompt,
    chatLoading,
    chatResponse,
    refreshPlan: fetchPlan,
    handleAddBudgetItem,
    handleUpdateBudgetItem,
    handleDeleteBudgetItem,
    handleToggleTask,
    handleAddTask,
    handleUpdateVendor,
    handleUpdateVendorStatus,
    handleAddVendor,
    handleSaveNotes,
    handleRefineSubmit,
  };
}
