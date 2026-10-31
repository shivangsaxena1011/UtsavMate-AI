import Link from "next/link";
import { PartyPopper } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EC4899] to-[#7C3AED] flex items-center justify-center">
            <PartyPopper className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-700">UtsavMate AI</span>
        </div>
        <p className="text-xs text-gray-400">
          Every celebration. One smart plan. Built with ❤️ for India.
        </p>
        <div className="flex gap-4 text-xs text-gray-400">
          <Link href="/dashboard" className="hover:text-[#7C3AED]">
            Dashboard
          </Link>
          <Link href="/events/new" className="hover:text-[#7C3AED]">
            Plan Event
          </Link>
          <Link href="/settings" className="hover:text-[#7C3AED]">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
