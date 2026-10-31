"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Sparkles, Calendar, Users, IndianRupee, MapPin,
  AlertTriangle, Clock, Store, Download,
  Printer, Plus, Trash2, Send, Loader2, Check,
  Info,
} from "lucide-react";
import { FullEventPlan, BudgetItem, TimelineTask, Vendor, BudgetSummary } from "@/lib/types";
import { computeBudgetSummary, formatINR, CATEGORY_LABELS } from "@/lib/engines/budget";

type Tab = "overview" | "budget" | "timeline" | "vendors" | "ai" | "export";

export default function EventWorkspacePage() {
  const urlParams = useParams();
  const eventId = urlParams?.id as string;

  const [plan, setPlan] = useState<FullEventPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Filter States
  const [taskFilter, setTaskFilter] = useState<"All Tasks" | "Pending" | "Completed" | "Overdue">("All Tasks");
  const [vendorFilter, setVendorFilter] = useState<string>("All");
  const [ideaFilter, setIdeaFilter] = useState<string>("All Ideas");

  // Chat state
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<{
    answer: string;
    suggestedAction?: { type: string; payload?: Record<string, unknown> };
    source: string;
  } | null>(null);

  // Modals
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [newBudgetItem, setNewBudgetItem] = useState<Partial<BudgetItem>>({
    category: "venue", name: "", estimatedAmount: 0, actualAmount: 0, status: "planned",
  });
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<TimelineTask>>({
    title: "", description: "", category: "General",
    dueDate: new Date().toISOString().split("T")[0], priority: "medium", status: "pending",
  });
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    category: "Venue", businessName: "", estimatedQuote: 0, finalQuote: 0, status: "not_contacted",
  });

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

  // Sync hash with activeTab
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as Tab;
      if (["overview", "budget", "timeline", "vendors", "ai", "export"].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
  };

  if (loading) return (
    <div className="py-24 flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
      <p className="text-sm text-gray-500 font-medium">Loading your event workspace...</p>
    </div>
  );

  if (error || !plan) return (
    <div className="py-16 text-center space-y-4">
      <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
      <h2 className="text-xl font-bold text-gray-900">Event Not Found</h2>
      <p className="text-sm text-gray-500">{error}</p>
      <Link href="/dashboard" className="inline-flex bg-[#7C3AED] text-white px-4 py-2 rounded-xl font-semibold text-sm">
        Back to Dashboard
      </Link>
    </div>
  );

  const summary: BudgetSummary = computeBudgetSummary(plan.budget, plan.event.totalBudget, plan.event.guestCount);
  const completedTasks = plan.tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = plan.tasks.filter((t) => t.isOverdue && t.status !== "completed").length;
  const utilizationPct = Math.min(100, summary.utilizationPercentage);

  // Filtered collections
  const filteredTasks = plan.tasks.filter((task) => {
    if (taskFilter === "Pending") return task.status !== "completed";
    if (taskFilter === "Completed") return task.status === "completed";
    if (taskFilter === "Overdue") return task.isOverdue && task.status !== "completed";
    return true;
  });

  const filteredVendors = plan.vendors.filter((v) => {
    if (vendorFilter === "All") return true;
    if (vendorFilter === "More") {
      const topCats = ["venue", "catering", "decor", "photography"];
      return !topCats.some((c) => v.category.toLowerCase().includes(c));
    }
    return v.category.toLowerCase().includes(vendorFilter.toLowerCase());
  });

  const filteredIdeas = plan.ideas.filter((idea) => {
    if (ideaFilter === "All" || ideaFilter === "All Ideas") return true;
    if (ideaFilter === "Decoration") return idea.section === "decor";
    if (ideaFilter === "Food & Menu") return idea.section === "food";
    if (ideaFilter === "Activities") return idea.section === "activity";
    if (ideaFilter === "Saving Tips") return idea.section === "saving";
    if (ideaFilter === "Theme Ideas") return idea.section === "decor" || idea.section === "favor";
    return true;
  });

  // Handlers
  const handleToggleTask = async (task: TimelineTask) => {
    const newStatus: TimelineTask["status"] = task.status === "completed" ? "pending" : "completed";
    const updated = { ...task, status: newStatus };
    setPlan({ ...plan, tasks: plan.tasks.map((t) => t.id === task.id ? updated : t) });
    try {
      await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated),
      });
    } catch { fetchPlan(); }
  };

  const handleUpdateBudgetItem = async (item: BudgetItem, changes: Partial<BudgetItem>) => {
    const updated = { ...item, ...changes };
    setPlan({ ...plan, budget: plan.budget.map((b) => b.id === item.id ? updated : b) });
    try {
      await fetch(`/api/events/${eventId}/budget`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated),
      });
    } catch { fetchPlan(); }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    setPlan({ ...plan, budget: plan.budget.filter((b) => b.id !== itemId) });
    try {
      await fetch(`/api/events/${eventId}/budget`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId }),
      });
    } catch { fetchPlan(); }
  };

  const handleUpdateVendor = async (vendor: Vendor, changes: Partial<Vendor>) => {
    const updated = { ...vendor, ...changes };
    setPlan({ ...plan, vendors: plan.vendors.map((v) => v.id === vendor.id ? updated : v) });
    try {
      await fetch(`/api/events/${eventId}/vendors`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated),
      });
    } catch { fetchPlan(); }
  };

  const handleRefineSubmit = async (customPrompt?: string, applyAction = false) => {
    const query = customPrompt || chatPrompt;
    if (!query.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/refine`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, applyAction }),
      });
      const data = await res.json();
      if (data.success) {
        setChatResponse({ answer: data.answer, suggestedAction: data.suggestedAction, source: data.source });
        if (data.updatedPlan) setPlan(data.updatedPlan);
      }
    } catch (err) { console.error(err); }
    finally { setChatLoading(false); }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "budget", label: "Budget", icon: IndianRupee },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "vendors", label: "Vendors", icon: Store },
    { id: "ai", label: "AI Ideas", icon: Sparkles },
    { id: "export", label: "Export", icon: Download },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Event Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#7C3AED]">
                  {plan.event.eventType.replace("_", " ")}
                </span>
                <span className="text-xs text-gray-400 font-medium uppercase">{plan.event.language || "en"}</span>
                {plan.aiGenerated && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini AI
                  </span>
                )}
                {!plan.aiGenerated && (
                  <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                    Offline Engine
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{plan.event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-400" /> {plan.event.eventDate}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-gray-400" /> {plan.event.city}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" /> {plan.event.guestCount} guests</span>
                <span className="flex items-center gap-1 font-semibold text-gray-900"><IndianRupee className="w-4 h-4 text-[#7C3AED]" /> {formatINR(plan.event.totalBudget)}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 no-print shrink-0">
              <button
                onClick={() => switchTab("ai")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Ideas
              </button>
              <button
                onClick={() => switchTab("export")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-t border-gray-100 flex overflow-x-auto scrollbar-hide gap-1 py-2 no-print">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#7C3AED] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warnings & Alerts */}
      {summary.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Budget Alert</p>
            <ul className="mt-1 space-y-0.5 text-amber-700 list-disc list-inside">
              {summary.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ─── TAB PANELS ─── */}

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Budget Utilization */}
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget Health</p>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatINR(plan.event.totalBudget)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${summary.isOverspent ? "bg-red-100 text-red-600" : "bg-[#D1FAE5] text-[#065F46]"}`}>
                    {summary.isOverspent ? `Over by ${formatINR(summary.overspentAmount)}` : "On Budget"}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${utilizationPct >= 90 ? "bg-red-500" : utilizationPct >= 70 ? "bg-amber-500" : "bg-[#7C3AED]"}`}
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-gray-500 font-medium">
                <span>Allocated: {formatINR(summary.totalEstimated)}</span>
                <span>Remaining Cash: <strong className={summary.remainingFromActual < 0 ? "text-red-500 font-bold" : "text-[#10B981] font-bold"}>{formatINR(summary.remainingFromActual)}</strong></span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cost Per Guest</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatINR(summary.costPerGuestEstimated)}</p>
              <p className="text-xs text-gray-400 mt-1">{plan.event.guestCount} guests</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tasks Done</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{completedTasks}/{plan.tasks.length}</p>
              {overdueTasks > 0 ? (
                <p className="text-xs text-red-500 font-semibold mt-1">{overdueTasks} overdue</p>
              ) : (
                <p className="text-xs text-[#10B981] font-semibold mt-1">On track ✓</p>
              )}
            </div>
          </div>

          {/* Quick preview of tasks + vendors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Upcoming Milestones</h3>
                <button onClick={() => switchTab("timeline")} className="text-xs font-semibold text-[#7C3AED] hover:underline">
                  View all
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {plan.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${task.status === "completed" ? "bg-[#10B981] border-[#10B981]" : "border-gray-300"}`}>
                        {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>{task.title}</p>
                        <p className="text-xs text-gray-400">{task.dueDate}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      task.priority === "high" ? "bg-red-100 text-red-600" :
                      task.priority === "medium" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                    }`}>{task.priority}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Vendor Status</h3>
                <button onClick={() => switchTab("vendors")} className="text-xs font-semibold text-[#7C3AED] hover:underline">
                  Manage
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {plan.vendors.slice(0, 4).map((v) => (
                  <div key={v.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.businessName}</p>
                      <p className="text-xs text-gray-400">{v.category} • Est. {formatINR(v.estimatedQuote)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      v.status === "booked" ? "bg-[#D1FAE5] text-[#065F46]" :
                      v.status === "quote_received" ? "bg-[#FEF3C7] text-[#92400E]" :
                      v.status === "contacted" ? "bg-[#EDE9FE] text-[#5B21B6]" : "bg-gray-100 text-gray-500"
                    }`}>{v.status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUDGET PLANNER */}
      {activeTab === "budget" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Budget Planner</h2>
              <p className="text-sm text-gray-500">
                Total Budget: <strong>{formatINR(plan.event.totalBudget)}</strong> • Allocated: <strong className={summary.utilizationPercentage > 100 ? "text-red-500" : "text-[#7C3AED]"}>{formatINR(summary.totalEstimated)} ({summary.utilizationPercentage}%)</strong> • Spent: <strong>{formatINR(summary.totalActual)}</strong> • Unallocated: <strong className={summary.remainingFromEstimated < 0 ? "text-red-500" : "text-[#10B981]"}>{formatINR(summary.remainingFromEstimated)}</strong>
              </p>
            </div>
            <button
              onClick={() => setShowAddBudgetModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Budget Allocation</span>
              <span>{summary.utilizationPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${summary.utilizationPercentage >= 90 ? "bg-red-500" : "bg-[#7C3AED]"}`}
                style={{ width: `${Math.min(100, summary.utilizationPercentage)}%` }}
              />
            </div>
          </div>

          {/* Budget Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Item</th>
                    <th className="px-5 py-3.5">Estimated (₹)</th>
                    <th className="px-5 py-3.5">Actual (₹)</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Variance</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {plan.budget.map((item) => {
                    const variance = (item.actualAmount || 0) - (item.estimatedAmount || 0);
                    const onTrack = item.actualAmount <= item.estimatedAmount || item.actualAmount === 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-800 text-xs uppercase tracking-wide whitespace-nowrap">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateBudgetItem(item, { name: e.target.value })}
                            className="bg-transparent hover:bg-white focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-gray-200 focus:border-[#7C3AED] w-full text-sm focus:outline-none"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="number" min={0} step={500}
                            value={item.estimatedAmount}
                            onChange={(e) => handleUpdateBudgetItem(item, { estimatedAmount: Number(e.target.value) })}
                            className="w-28 px-2 py-1 rounded-lg border border-gray-200 focus:border-[#7C3AED] text-sm font-semibold focus:outline-none"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="number" min={0} step={500}
                            value={item.actualAmount}
                            onChange={(e) => handleUpdateBudgetItem(item, { actualAmount: Number(e.target.value) })}
                            className="w-28 px-2 py-1 rounded-lg border border-gray-200 focus:border-[#7C3AED] text-sm focus:outline-none"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${onTrack ? "bg-[#D1FAE5] text-[#065F46]" : "bg-red-100 text-red-600"}`}>
                            {onTrack ? "On Track" : "Over Budget"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold ${variance > 0 ? "text-red-500" : variance < 0 ? "text-[#10B981]" : "text-gray-400"}`}>
                            {variance > 0 ? `+${formatINR(variance)}` : formatINR(variance)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${item.name}"?`)) handleDeleteBudgetItem(item.id);
                            }}
                            aria-label={`Delete budget item ${item.name}`}
                            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                  <tr>
                    <td className="px-5 py-3.5 text-gray-900" colSpan={2}>TOTALS</td>
                    <td className="px-5 py-3.5 text-gray-900">{formatINR(summary.totalEstimated)}</td>
                    <td className="px-5 py-3.5 text-gray-900">{formatINR(summary.totalActual)}</td>
                    <td className="px-5 py-3.5" />
                    <td className="px-5 py-3.5">
                      <span className={summary.remainingFromEstimated < 0 ? "text-red-500 font-bold" : "text-[#10B981] font-bold"}>
                        Unallocated: {formatINR(summary.remainingFromEstimated)}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Timeline & Tasks</h2>
              <p className="text-sm text-gray-500">{completedTasks}/{plan.tasks.length} completed • Event Date: {plan.event.eventDate}</p>
            </div>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(["All Tasks", "Pending", "Completed", "Overdue"] as const).map((filter) => {
              const active = taskFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setTaskFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                No tasks match the &ldquo;{taskFilter}&rdquo; filter.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 transition-all ${
                    task.status === "completed" ? "border-[#D1FAE5] bg-[#F0FDF4]" :
                    task.isOverdue ? "border-red-200 bg-red-50" : "border-gray-100"
                  }`}
                >
                  <button
                    onClick={() => handleToggleTask(task)}
                    aria-label={task.status === "completed" ? `Mark ${task.title} as pending` : `Mark ${task.title} as completed`}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.status === "completed" ? "bg-[#10B981] border-[#10B981]" : "border-gray-300 hover:border-[#7C3AED]"
                    }`}
                  >
                    {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-bold ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {task.title}
                      </p>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{task.category}</span>
                      {task.isOverdue && task.status !== "completed" && (
                        <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">OVERDUE</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{task.description}</p>
                    <p className="text-xs text-gray-400">Due: {task.dueDate}</p>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    task.priority === "high" ? "bg-red-100 text-red-600" :
                    task.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VENDORS */}
      {activeTab === "vendors" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vendor Management</h2>
              <p className="text-sm text-gray-500">{plan.vendors.length} vendors • Track quotes, status, and contacts</p>
            </div>
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {["All", "Venue", "Catering", "Decor", "Photography", "More"].map((cat) => {
              const active = vendorFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setVendorFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVendors.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                No vendors found in this category.
              </div>
            ) : (
              filteredVendors.map((vendor) => (
                <div key={vendor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wide">{vendor.category}</p>
                      <p className="text-base font-bold text-gray-900 mt-0.5">{vendor.businessName}</p>
                      {vendor.phone && <p className="text-xs text-gray-400 mt-0.5">{vendor.phone}</p>}
                    </div>
                    <select
                      value={vendor.status}
                      onChange={(e) => handleUpdateVendor(vendor, { status: e.target.value as Vendor["status"] })}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none ${
                        vendor.status === "booked" ? "bg-[#D1FAE5] border-[#6EE7B7] text-[#065F46]" :
                        vendor.status === "quote_received" ? "bg-[#FEF3C7] border-amber-300 text-[#92400E]" :
                        vendor.status === "contacted" ? "bg-[#EDE9FE] border-[#C4B5FD] text-[#5B21B6]" :
                        "bg-gray-100 border-gray-200 text-gray-600"
                      }`}
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="contacted">Contacted</option>
                      <option value="quote_received">Quote Received</option>
                      <option value="booked">Booked ✓</option>
                      <option value="not_proceeding">Not Proceeding</option>
                    </select>
                  </div>

                  {/* Quote Comparison */}
                  <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 font-medium">Estimated</p>
                      <p className="font-bold text-gray-900 text-sm">{formatINR(vendor.estimatedQuote)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Final Quote</p>
                      <input
                        type="number" min={0} step={1000}
                        value={vendor.finalQuote}
                        onChange={(e) => handleUpdateVendor(vendor, { finalQuote: Number(e.target.value) })}
                        className="w-full bg-white px-2 py-0.5 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>
                  </div>

                  {/* Questions to Ask */}
                  {vendor.questionsToAsk && vendor.questionsToAsk.length > 0 && (
                    <details className="group">
                      <summary className="text-xs font-bold text-[#7C3AED] cursor-pointer hover:underline">
                        {vendor.questionsToAsk.length} questions to ask →
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs text-gray-500 list-disc pl-4">
                        {vendor.questionsToAsk.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AI IDEAS */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Ideas & Suggestions</h2>
            <p className="text-sm text-gray-500">Personalized recommendations based on your event requirements</p>
          </div>

          {/* Idea Category Pills */}
          <div className="flex flex-wrap gap-2">
            {["All Ideas", "Theme Ideas", "Decoration", "Food & Menu", "Activities", "Saving Tips"].map((cat) => {
              const active = ideaFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setIdeaFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-[#EDE9FE] hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredIdeas.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                No ideas found under &ldquo;{ideaFilter}&rdquo;.
              </div>
            ) : (
              filteredIdeas.map((idea) => (
                <div key={idea.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Decorative top strip by section */}
                  <div className={`h-1.5 ${
                    idea.section === "theme" ? "bg-gradient-to-r from-[#7C3AED] to-[#EC4899]" :
                    idea.section === "food" ? "bg-gradient-to-r from-[#F59E0B] to-[#EF4444]" :
                    idea.section === "decor" ? "bg-gradient-to-r from-[#10B981] to-[#3B82F6]" :
                    "bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                  }`} />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] uppercase tracking-wide">
                        {idea.section}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{idea.costTier}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{idea.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{idea.description}</p>
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {idea.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* AI Assistant Chat */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7C3AED]" />
                <span>AI Assistant</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Ask anything about your event in English, Hindi, or Hinglish</p>
            </div>

            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2">
              {[
                "Suggest decoration ideas for a wedding under ₹50,000",
                "Reduce my estimated event budget by 15%",
                "Suggest eco-friendly alternatives",
                `Regional food counters for ${plan.event.city}`,
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setChatPrompt(q); handleRefineSubmit(q); }}
                  className="text-xs bg-[#F9FAFB] border border-gray-200 text-gray-700 hover:bg-[#EDE9FE] hover:border-[#7C3AED] hover:text-[#7C3AED] px-3 py-1.5 rounded-xl transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRefineSubmit()}
                placeholder="Ask anything... (English, Hindi, or Hinglish)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7C3AED] text-sm focus:outline-none"
              />
              <button
                onClick={() => handleRefineSubmit()}
                disabled={chatLoading || !chatPrompt.trim()}
                aria-label="Send query to AI celebration assistant"
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
              >
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Response */}
            {chatResponse && (
              <div className="bg-[#F9FAFB] rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-bold text-gray-700">UtsavMate AI</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${chatResponse.source === "gemini" ? "bg-[#D1FAE5] text-[#065F46]" : "bg-gray-100 text-gray-500"}`}>
                    {chatResponse.source === "gemini" ? "Gemini AI" : "Offline Engine"}
                  </span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{chatResponse.answer}</p>
                {chatResponse.suggestedAction?.type === "adjust_budget" && (
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Apply this budget reduction to saved records?</span>
                    <button
                      onClick={() => handleRefineSubmit(chatPrompt, true)}
                      className="bg-[#10B981] text-white text-xs font-bold px-4 py-2 rounded-xl"
                    >
                      Apply Changes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPORT */}
      {activeTab === "export" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export & Share</h2>
            <p className="text-sm text-gray-500">Download or print your complete event plan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Markdown Plan", sub: "Full event dossier", format: "markdown", color: "bg-[#EDE9FE] text-[#7C3AED]", ext: ".md" },
              { label: "Budget CSV", sub: "Excel/Sheets compatible", format: "csv-budget", color: "bg-[#D1FAE5] text-[#065F46]", ext: ".csv" },
              { label: "Vendors CSV", sub: "Contact & quote tracking", format: "csv-vendors", color: "bg-[#FEF3C7] text-[#92400E]", ext: ".csv" },
              { label: "Calendar .ics", sub: "Sync to Google Calendar", format: "ics", color: "bg-[#FCE7F3] text-[#9D174D]", ext: ".ics" },
            ].map((item) => (
              <a
                key={item.format}
                href={`/api/events/${eventId}/export?format=${item.format}`}
                download
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#7C3AED]/30 transition-all flex flex-col gap-3 group"
              >
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center font-bold text-sm`}>
                  {item.ext}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
                <div className="text-xs font-bold text-[#7C3AED] flex items-center gap-1 group-hover:underline">
                  <Download className="w-3.5 h-3.5" /> Download
                </div>
              </a>
            ))}
          </div>

          {/* Print Button */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Print Dossier</p>
              <p className="text-xs text-gray-400">Clean print-optimized layout for physical binders</p>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#312E81] transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Plan
            </button>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* Add Budget Modal */}
      {showAddBudgetModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-budget-title" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch(`/api/events/${eventId}/budget`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBudgetItem),
              });
              const data = await res.json();
              if (data.success) { setPlan({ ...plan, budget: data.budget }); setShowAddBudgetModal(false); }
            }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 id="add-budget-title" className="font-bold text-gray-900 text-lg">Add Budget Item</h3>
            <div>
              <label className="text-xs font-semibold text-gray-500">Category</label>
              <select value={newBudgetItem.category} onChange={(e) => setNewBudgetItem({ ...newBudgetItem, category: e.target.value as BudgetItem["category"] })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED] bg-white">
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Item Name</label>
              <input type="text" required value={newBudgetItem.name} onChange={(e) => setNewBudgetItem({ ...newBudgetItem, name: e.target.value })}
                placeholder="e.g., Live Chaat Counter"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Estimated Amount (₹)</label>
              <input type="number" min={0} required value={newBudgetItem.estimatedAmount} onChange={(e) => setNewBudgetItem({ ...newBudgetItem, estimatedAmount: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddBudgetModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold">Add Item</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-task-title" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch(`/api/events/${eventId}/tasks`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newTask),
              });
              const data = await res.json();
              if (data.success) { setPlan({ ...plan, tasks: data.tasks }); setShowAddTaskModal(false); }
            }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 id="add-task-title" className="font-bold text-gray-900 text-lg">Add Task</h3>
            <div>
              <label className="text-xs font-semibold text-gray-500">Task Title</label>
              <input type="text" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Book Mehndi Artist"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Due Date</label>
              <input type="date" required value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Priority</label>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TimelineTask["priority"] })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#7C3AED]">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddTaskModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold">Add Task</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-vendor-title" className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch(`/api/events/${eventId}/vendors`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newVendor),
              });
              const data = await res.json();
              if (data.success) { setPlan({ ...plan, vendors: data.vendors }); setShowAddVendorModal(false); }
            }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 id="add-vendor-title" className="font-bold text-gray-900 text-lg">Add Vendor</h3>
            <div>
              <label className="text-xs font-semibold text-gray-500">Category</label>
              <input type="text" required value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                placeholder="e.g., Catering, Decor, Photography"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Vendor Name</label>
              <input type="text" required value={newVendor.businessName} onChange={(e) => setNewVendor({ ...newVendor, businessName: e.target.value })}
                placeholder="e.g., Royal Caterers Bhopal"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Estimated Quote (₹)</label>
              <input type="number" min={0} value={newVendor.estimatedQuote} onChange={(e) => setNewVendor({ ...newVendor, estimatedQuote: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowAddVendorModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold">Add Vendor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
