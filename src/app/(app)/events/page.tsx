import Link from "next/link";
import { listEvents } from "@/lib/storage";
import { formatINR } from "@/lib/engines/budget";
import { CalendarDays, MapPin, Users, IndianRupee, PlusCircle, ArrowRight } from "lucide-react";

import { getDaysUntil } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  const events = listEvents();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} event{events.length !== 1 ? "s" : ""} saved</p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm text-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Event</span>
        </Link>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EDE9FE] flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-[#7C3AED]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No events yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Create your first celebration plan. UtsavMate AI will generate budgets, timelines, vendors, and ideas instantly.
          </p>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 bg-[#7C3AED] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map((evt) => {
            const daysUntil = getDaysUntil(evt.eventDate);
            const isUpcoming = daysUntil > 0;

            return (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#7C3AED]/30 transition-all flex flex-col"
              >
                {/* Card Header Banner */}
                <div className="h-2 rounded-t-2xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899]" />

                <div className="p-5 flex flex-col flex-1 space-y-4">
                  {/* Type + Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#7C3AED] uppercase tracking-wide">
                      {evt.eventType.replace("_", " ")}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isUpcoming
                          ? "bg-[#D1FAE5] text-[#065F46]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isUpcoming ? `${daysUntil} days left` : "Past"}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#7C3AED] transition-colors line-clamp-1">
                    {evt.title}
                  </h3>

                  {/* Meta */}
                  <div className="space-y-1.5 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 shrink-0 text-gray-400" />
                      <span>{evt.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                      <span>{evt.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 shrink-0 text-gray-400" />
                      <span>{evt.guestCount} guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4 shrink-0 text-gray-400" />
                      <span className="font-bold text-gray-900">{formatINR(evt.totalBudget)}</span>
                    </div>
                  </div>

                  {/* Footer Link */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm font-semibold text-[#7C3AED]">
                    <span>Open workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
