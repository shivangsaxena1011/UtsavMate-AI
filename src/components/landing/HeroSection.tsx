import Link from "next/link";
import { Sparkles, PartyPopper, ArrowRight } from "lucide-react";

const EVENT_TYPES = [
  { emoji: "💍", label: "Weddings" },
  { emoji: "🎂", label: "Birthdays" },
  { emoji: "💑", label: "Anniversaries" },
  { emoji: "🎓", label: "College Fests" },
  { emoji: "🏘️", label: "Community Events" },
  { emoji: "✨", label: "Custom Events" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4C1D95] text-white py-20 px-4">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #EC4899 0%, transparent 50%), radial-gradient(circle at 80% 20%, #7C3AED 0%, transparent 50%)",
        }}
      />
      <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider text-white/80 border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-[#EC4899]" />
          Powered by Google Gemini AI
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Every Celebration.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EC4899] to-[#F59E0B]">
            One Smart Plan.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
          UtsavMate AI turns your celebration ideas into an actionable budget, timeline, vendor checklist, and personalized AI recommendations — in seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all text-base"
          >
            <PartyPopper className="w-5 h-5" />
            Plan My Event — Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/20 transition-all text-base"
          >
            View Dashboard
          </Link>
        </div>
        {/* Event type chips */}
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {EVENT_TYPES.map((et) => (
            <span
              key={et.label}
              className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white/70 border border-white/10"
            >
              {et.emoji} {et.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
