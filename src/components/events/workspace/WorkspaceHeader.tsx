import { Sparkles, Calendar, Users, IndianRupee, MapPin, Download } from "lucide-react";
import { FullEventPlan } from "@/lib/types";
import { formatINR } from "@/lib/engines/budget";
import { TabType } from "@/hooks/useEventWorkspace";

export interface WorkspaceHeaderProps {
  plan: FullEventPlan;
  onSwitchTab: (tab: TabType) => void;
}

export function WorkspaceHeader({ plan, onSwitchTab }: WorkspaceHeaderProps) {
  return (
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
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400" /> {plan.event.eventDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" /> {plan.event.city}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-400" /> {plan.event.guestCount} guests
            </span>
            <span className="flex items-center gap-1 font-semibold text-gray-900">
              <IndianRupee className="w-4 h-4 text-[#7C3AED]" /> {formatINR(plan.event.totalBudget)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 no-print shrink-0">
          <button
            onClick={() => onSwitchTab("ai")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Ideas
          </button>
          <button
            onClick={() => onSwitchTab("export")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
