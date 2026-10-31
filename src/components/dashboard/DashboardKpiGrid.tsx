import { CalendarDays, Clock, IndianRupee, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/engines/budget";

export interface DashboardKpiGridProps {
  totalEvents: number;
  upcomingCount: number;
  totalBudget: number;
}

export function DashboardKpiGrid({
  totalEvents,
  upcomingCount,
  totalBudget,
}: DashboardKpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Total Events
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalEvents}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[#7C3AED]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Upcoming</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{upcomingCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FCE7F3] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#EC4899]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Total Budget
            </p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatINR(totalBudget)}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-[#F59E0B]" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Remaining</p>
            <p className="text-2xl font-extrabold text-[#10B981] mt-1">{formatINR(totalBudget)}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>
      </div>
    </div>
  );
}
