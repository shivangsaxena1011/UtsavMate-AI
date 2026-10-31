import Link from "next/link";
import { PlusCircle, Sparkles, Store } from "lucide-react";

export interface QuickActionsPanelProps {
  firstEventId?: string;
}

export function QuickActionsPanel({ firstEventId }: QuickActionsPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <h2 className="font-bold text-gray-900 text-sm">Quick Actions</h2>

      <Link
        href="/events/new"
        className="flex items-center gap-3 p-3 rounded-xl bg-[#EDE9FE] hover:bg-[#DDD6FE] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center">
          <PlusCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#5B21B6]">Create Event</p>
          <p className="text-xs text-[#7C3AED]">Start planning with AI</p>
        </div>
      </Link>

      <Link
        href={firstEventId ? `/events/${firstEventId}#ai` : "/events/new"}
        className="flex items-center gap-3 p-3 rounded-xl bg-[#FCE7F3] hover:bg-pink-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#EC4899] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#9D174D]">Generate AI Plan</p>
          <p className="text-xs text-[#BE185D]">AI-powered suggestions</p>
        </div>
      </Link>

      <Link
        href={firstEventId ? `/events/${firstEventId}#vendors` : "/events/new"}
        className="flex items-center gap-3 p-3 rounded-xl bg-[#FEF3C7] hover:bg-amber-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#92400E]">Manage Vendors</p>
          <p className="text-xs text-[#B45309]">Track quotes & bookings</p>
        </div>
      </Link>
    </div>
  );
}
