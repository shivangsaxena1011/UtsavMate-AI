import Link from "next/link";
import { CalendarDays, MapPin, Users, PlusCircle, ArrowRight } from "lucide-react";
import { FullEventPlan } from "@/lib/types";
import { formatINR } from "@/lib/engines/budget";
import { getDaysUntil } from "@/lib/utils/date";

export interface UpcomingEventsListProps {
  events: FullEventPlan["event"][];
}

export function UpcomingEventsList({ events }: UpcomingEventsListProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Upcoming Events</h2>
        <Link
          href="/events"
          className="text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-1"
        >
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
                      isUpcoming ? "bg-[#EDE9FE] text-[#7C3AED]" : "bg-gray-100 text-gray-500"
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
  );
}
