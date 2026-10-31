import Link from "next/link";
import {
  Sparkles, IndianRupee, ListTodo, Store, Download,
  ArrowRight, CheckCircle2, PartyPopper, CalendarDays, Star
} from "lucide-react";

const FEATURES = [
  {
    icon: IndianRupee,
    title: "Smart Budget Planner",
    desc: "Break your budget into venue, food, decor, photography and more. Get instant overspend warnings.",
    color: "bg-[#FEF3C7]",
    iconColor: "text-[#F59E0B]",
  },
  {
    icon: CalendarDays,
    title: "Auto Event Timeline",
    desc: "Date-aware tasks and deadlines generated from your event date. Never miss a milestone.",
    color: "bg-[#EDE9FE]",
    iconColor: "text-[#7C3AED]",
  },
  {
    icon: Store,
    title: "Vendor Checklist",
    desc: "Track caterers, venues, photographers and decorators. Record quotes and booking status.",
    color: "bg-[#FCE7F3]",
    iconColor: "text-[#EC4899]",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Ideas",
    desc: "Gemini AI suggests themes, menus, activities and cost-saving alternatives tailored to you.",
    color: "bg-[#D1FAE5]",
    iconColor: "text-[#10B981]",
  },
  {
    icon: ListTodo,
    title: "Editable Plans",
    desc: "Everything is editable. Update a budget item and totals recalculate automatically.",
    color: "bg-[#EDE9FE]",
    iconColor: "text-[#7C3AED]",
  },
  {
    icon: Download,
    title: "Export & Share",
    desc: "Download your plan as Markdown, CSV, or ICS calendar. Print for family and vendors.",
    color: "bg-[#FCE7F3]",
    iconColor: "text-[#EC4899]",
  },
];

const EVENT_TYPES = [
  { emoji: "💍", label: "Weddings" },
  { emoji: "🎂", label: "Birthdays" },
  { emoji: "💑", label: "Anniversaries" },
  { emoji: "🎓", label: "College Fests" },
  { emoji: "🏘️", label: "Community Events" },
  { emoji: "✨", label: "Custom Events" },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    location: "Bhopal",
    text: "Planned our entire wedding reception in under 20 minutes. The budget breakdown was spot on!",
    rating: 5,
  },
  {
    name: "Rahul M.",
    location: "Pune",
    text: "The AI suggested ideas I'd never have thought of. Saved us ₹40,000 on decorations alone.",
    rating: 5,
  },
  {
    name: "Anjali K.",
    location: "Delhi",
    text: "Used it for our college farewell. The timeline with task reminders kept us on track.",
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4C1D95] text-white py-20 px-4">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #EC4899 0%, transparent 50%), radial-gradient(circle at 80% 20%, #7C3AED 0%, transparent 50%)'}} />
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
              <span key={et.label} className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white/70 border border-white/10">
                {et.emoji} {et.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {[
            { value: "6+", label: "Event Types" },
            { value: "₹0", label: "Cost to Use" },
            { value: "AI", label: "Gemini-Powered" },
            { value: "∞", label: "Events Supported" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-extrabold text-[#7C3AED]">{stat.value}</p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-16 px-4 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900">Everything you need to plan perfectly</h2>
            <p className="text-gray-500">One platform. Every feature you need to organize a beautiful celebration.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow space-y-3">
                  <div className={`w-11 h-11 rounded-xl ${feat.color} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${feat.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-gray-900">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-gray-900">From idea to actionable plan in 3 steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Create Your Event", desc: "Enter your event type, date, city, guest count, budget and preferences.", icon: CalendarDays, color: "from-[#7C3AED] to-[#EC4899]" },
              { step: "02", title: "AI Generates Plan", desc: "Gemini AI creates a budget breakdown, task timeline, vendor list and themed ideas.", icon: Sparkles, color: "from-[#EC4899] to-[#F59E0B]" },
              { step: "03", title: "Manage & Export", desc: "Edit every detail, track vendors, update tasks, and export your plan.", icon: Download, color: "from-[#F59E0B] to-[#10B981]" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <span className="text-3xl font-extrabold text-[#7C3AED]/20">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 bg-[#7C3AED] text-white font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-[#6D28D9] hover:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4" /> Start Planning Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Loved by planners across India</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#1E1B4B] to-[#4C1D95] text-white">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-extrabold">Ready to plan your perfect celebration?</h2>
          <p className="text-white/70">Join thousands planning smarter with UtsavMate AI.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <PartyPopper className="w-5 h-5" /> Plan My Event
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/10 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {["Free to use", "No sign up required", "Gemini AI powered", "Export & share"].map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-white/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#EC4899] to-[#7C3AED] flex items-center justify-center">
              <PartyPopper className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-700">UtsavMate AI</span>
          </div>
          <p className="text-xs text-gray-400">Every celebration. One smart plan. Built with ❤️ for India.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="/dashboard" className="hover:text-[#7C3AED]">Dashboard</Link>
            <Link href="/events/new" className="hover:text-[#7C3AED]">Plan Event</Link>
            <Link href="/settings" className="hover:text-[#7C3AED]">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
