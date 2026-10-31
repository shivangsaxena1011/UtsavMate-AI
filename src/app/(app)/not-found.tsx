import Link from "next/link";
import { CalendarX2, CalendarDays, PlusCircle, LayoutDashboard } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C3AED]">
        <CalendarX2 className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Event Not Found
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          The celebration plan you requested could not be located. It may have been archived, deleted, or the identifier in the link is incorrect.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
        >
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          View All Events
        </Link>

        <Link
          href="/events/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Create New Event
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
