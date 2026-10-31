import Link from "next/link";
import { PlusCircle } from "lucide-react";

export function DashboardWelcomeBanner() {
  return (
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
  );
}
