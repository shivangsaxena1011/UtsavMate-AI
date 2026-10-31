import { Check } from "lucide-react";
import { FullEventPlan, BudgetSummary } from "@/lib/types";
import { formatINR } from "@/lib/engines/budget";
import { TabType } from "@/hooks/useEventWorkspace";

export interface OverviewTabProps {
  plan: FullEventPlan;
  summary: BudgetSummary;
  completedTasks: number;
  overdueTasks: number;
  onSwitchTab: (tab: TabType) => void;
}

export function OverviewTab({
  plan,
  summary,
  completedTasks,
  overdueTasks,
  onSwitchTab,
}: OverviewTabProps) {
  const utilizationPct = Math.min(100, summary.utilizationPercentage);

  return (
    <div
      role="tabpanel"
      id="tabpanel-overview"
      aria-labelledby="tab-overview"
      tabIndex={0}
      className="space-y-5"
    >
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
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  summary.isOverspent ? "bg-red-100 text-red-600" : "bg-[#D1FAE5] text-[#065F46]"
                }`}
              >
                {summary.isOverspent ? `Over by ${formatINR(summary.overspentAmount)}` : "On Budget"}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                utilizationPct >= 90 ? "bg-red-500" : utilizationPct >= 70 ? "bg-amber-500" : "bg-[#7C3AED]"
              }`}
              style={{ width: `${utilizationPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-500 font-medium">
            <span>Allocated: {formatINR(summary.totalEstimated)}</span>
            <span>
              Remaining Cash:{" "}
              <strong className={summary.remainingFromActual < 0 ? "text-red-500 font-bold" : "text-[#10B981] font-bold"}>
                {formatINR(summary.remainingFromActual)}
              </strong>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cost Per Guest</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatINR(summary.costPerGuestEstimated)}</p>
          <p className="text-xs text-gray-400 mt-1">{plan.event.guestCount} guests</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tasks Done</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {completedTasks}/{plan.tasks.length}
          </p>
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
            <button onClick={() => onSwitchTab("timeline")} className="text-xs font-semibold text-[#7C3AED] hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {plan.tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      task.status === "completed" ? "bg-[#10B981] border-[#10B981]" : "border-gray-300"
                    }`}
                  >
                    {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400">{task.dueDate}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    task.priority === "high"
                      ? "bg-red-100 text-red-600"
                      : task.priority === "medium"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Vendor Status</h3>
            <button onClick={() => onSwitchTab("vendors")} className="text-xs font-semibold text-[#7C3AED] hover:underline">
              Manage
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {plan.vendors.slice(0, 4).map((v) => (
              <div key={v.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.businessName}</p>
                  <p className="text-xs text-gray-400">
                    {v.category} • Est. {formatINR(v.estimatedQuote)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    v.status === "booked"
                      ? "bg-[#D1FAE5] text-[#065F46]"
                      : v.status === "quote_received"
                      ? "bg-[#FEF3C7] text-[#92400E]"
                      : v.status === "contacted"
                      ? "bg-[#EDE9FE] text-[#5B21B6]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {v.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
