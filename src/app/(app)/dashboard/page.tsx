import Link from "next/link";
import {
  CalendarDays, Users, IndianRupee, TrendingUp,
  Sparkles, PlusCircle, ArrowRight, Clock, Store,
  CheckCircle2, AlertTriangle, MapPin
} from "lucide-react";
import { listEvents } from "@/lib/storage";
import { computeBudgetSummary, formatINR } from "@/lib/engines/budget";
import { getEventPlan } from "@/lib/storage";

export const dynamic = "force-dynamic";

function getDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const now = new Date();
  return Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const events = listEvents();

  // Compute aggregate stats
  const totalBudget = events.reduce((s, e) => s + e.totalBudget, 0);
  const upcomingEvents = events.filter((e) => getDaysUntil(e.eventDate) > 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back! 👋</h1>
            <p className="text-white/80 text-sm mt-1">
              Let&apos;s make your next celebration amazing ✨
            </p>
          </div>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 bg-white text-[#7C3AED] font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Event</span>
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Events</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{events.length}</p>
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
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{upcomingEvents.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#FCE7F3] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#EC4899]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Budget</p>
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
              <p className="text-2xl font-extrabold text-[#10B981] mt-1">
                {formatINR(totalBudget)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Upcoming Events</h2>
            <Link href="/events" className="text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-50">
            {events.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EDE9FE] flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-[#7C3AED]" />
                </div>
                <p className="text-sm font-medium text-gray-500">No events yet</p>
                <Link
                  href="/events/new"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7C3AED] hover:underline"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create your first event
                </Link>
              </div>
            ) : (
              events.map((event) => {
                const days = getDaysUntil(event.eventDate);
                const isUpcoming = days > 0;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Event Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {event.title.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#7C3AED] transition-colors">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> {event.eventDate}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.city}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {event.guestCount}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatINR(event.totalBudget)}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isUpcoming
                            ? "bg-[#EDE9FE] text-[#7C3AED]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isUpcoming ? `${days}d left` : "Past"}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-4">
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
              href={events[0] ? `/events/${events[0].id}#ai` : "/events/new"}
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
              href={events[0] ? `/events/${events[0].id}#vendors` : "/events/new"}
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

          {/* Feature Highlights */}
          <div className="bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-2xl p-5 text-white space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EC4899]" />
              <span className="text-sm font-bold">AI Features Active</span>
            </div>
            <ul className="space-y-1.5 text-xs text-white/70">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Smart budget allocation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Date-aware timeline</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Vendor management</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Gemini AI suggestions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Hindi/Hinglish support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
