import Link from "next/link";
import { PartyPopper, Sparkles } from "lucide-react";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#7C3AED] flex items-center justify-center shadow-sm">
            <PartyPopper className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold text-gray-900">UtsavMate </span>
            <span className="text-base font-extrabold text-[#7C3AED]">AI</span>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-[#7C3AED] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#7C3AED] transition-colors">How it Works</a>
          <a href="#testimonials" className="hover:text-[#7C3AED] transition-colors">Reviews</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-1.5 bg-[#7C3AED] text-white text-sm font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-[#6D28D9] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Plan My Event
          </Link>
        </div>
      </div>
    </nav>
  );
}
