import { Plus, Trash2 } from "lucide-react";
import { FullEventPlan, BudgetItem, BudgetSummary } from "@/lib/types";
import { formatINR, CATEGORY_LABELS } from "@/lib/engines/budget";

export interface BudgetTabProps {
  plan: FullEventPlan;
  summary: BudgetSummary;
  onOpenAddBudgetModal: () => void;
  onUpdateBudgetItem: (item: BudgetItem, changes: Partial<BudgetItem>) => Promise<void>;
  onDeleteBudgetItem: (itemId: string) => Promise<void>;
}

export function BudgetTab({
  plan,
  summary,
  onOpenAddBudgetModal,
  onUpdateBudgetItem,
  onDeleteBudgetItem,
}: BudgetTabProps) {
  return (
    <div
      role="tabpanel"
      id="tabpanel-budget"
      aria-labelledby="tab-budget"
      tabIndex={0}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Budget Planner</h2>
          <p className="text-sm text-gray-500">
            Total Budget: <strong>{formatINR(plan.event.totalBudget)}</strong> • Allocated:{" "}
            <strong className={summary.utilizationPercentage > 100 ? "text-red-500" : "text-[#7C3AED]"}>
              {formatINR(summary.totalEstimated)} ({summary.utilizationPercentage}%)
            </strong>{" "}
            • Spent: <strong>{formatINR(summary.totalActual)}</strong> • Unallocated:{" "}
            <strong className={summary.remainingFromEstimated < 0 ? "text-red-500" : "text-[#10B981]"}>
              {formatINR(summary.remainingFromEstimated)}
            </strong>
          </p>
        </div>
        <button
          onClick={onOpenAddBudgetModal}
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
            className={`h-full rounded-full transition-all ${
              summary.utilizationPercentage >= 90 ? "bg-red-500" : "bg-[#7C3AED]"
            }`}
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
                        aria-label={`Name for ${item.name}`}
                        onChange={(e) => onUpdateBudgetItem(item, { name: e.target.value })}
                        className="bg-transparent hover:bg-white focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-gray-200 focus:border-[#7C3AED] w-full text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={item.estimatedAmount}
                        aria-label={`Estimated amount for ${item.name}`}
                        onChange={(e) => onUpdateBudgetItem(item, { estimatedAmount: Number(e.target.value) })}
                        className="w-28 px-2 py-1 rounded-lg border border-gray-200 focus:border-[#7C3AED] text-sm font-semibold focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={item.actualAmount}
                        aria-label={`Actual amount for ${item.name}`}
                        onChange={(e) => onUpdateBudgetItem(item, { actualAmount: Number(e.target.value) })}
                        className="w-28 px-2 py-1 rounded-lg border border-gray-200 focus:border-[#7C3AED] text-sm focus:outline-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          onTrack ? "bg-[#D1FAE5] text-[#065F46]" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {onTrack ? "On Track" : "Over Budget"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-bold ${
                          variance > 0 ? "text-red-500" : variance < 0 ? "text-[#10B981]" : "text-gray-400"
                        }`}
                      >
                        {variance > 0 ? `+${formatINR(variance)}` : formatINR(variance)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.name}"?`)) onDeleteBudgetItem(item.id);
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
                <td className="px-5 py-3.5 text-gray-900" colSpan={2}>
                  TOTALS
                </td>
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
  );
}
