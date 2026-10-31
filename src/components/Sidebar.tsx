"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  IndianRupee,
  ListTodo,
  Store,
  Sparkles,
  Download,
  Settings,
  PartyPopper,
  PlusCircle,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "My Events", icon: CalendarDays },
];

const FEATURE_ITEMS = [
  { hash: "budget", label: "Budget", icon: IndianRupee },
  { hash: "timeline", label: "Timeline", icon: ListTodo },
  { hash: "vendors", label: "Vendors", icon: Store },
  { hash: "ai", label: "AI Ideas", icon: Sparkles },
  { hash: "export", label: "Export", icon: Download },
];

const BOTTOM_ITEMS = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isEventWorkspace = pathname.startsWith("/events/") && pathname !== "/events/new";
  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-64 min-h-screen bg-[#1E1B4B] text-white flex flex-col fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#7C3AED] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <PartyPopper className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">
              UtsavMate <span className="text-[#EC4899]">AI</span>
            </div>
            <div className="text-[10px] text-white/50 font-medium">Smart Celebration Planner</div>
          </div>
        </Link>
      </div>

      {/* Primary Nav */}
      <nav aria-label="Sidebar Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </Link>
          );
        })}

        {/* Features section */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Plan Features
          </p>
        </div>
        {FEATURE_ITEMS.map((item) => {
          const Icon = item.icon;
          const targetHref = isEventWorkspace ? `#${item.hash}` : `/events`;
          return (
            <Link
              key={item.label}
              href={targetHref}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all"
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* New Event CTA */}
        <div className="pt-4">
          <Link
            href="/events/new"
            className="flex items-center gap-2 w-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] hover:from-[#6D28D9] hover:to-[#DB2777] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Event</span>
          </Link>
        </div>
      </nav>

      {/* Bottom Settings */}
      <div className="px-3 py-4 border-t border-white/10">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all"
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
