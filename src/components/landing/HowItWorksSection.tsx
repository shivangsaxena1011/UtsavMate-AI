import Link from "next/link";
import { CalendarDays, Sparkles, Download, ArrowRight } from "lucide-react";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900">
            From idea to actionable plan in 3 steps
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Create Your Event",
              desc: "Enter your event type, date, city, guest count, budget and preferences.",
              icon: CalendarDays,
              color: "from-[#7C3AED] to-[#EC4899]",
            },
            {
              step: "02",
              title: "AI Generates Plan",
              desc: "Gemini AI creates a budget breakdown, task timeline, vendor list and themed ideas.",
              icon: Sparkles,
              color: "from-[#EC4899] to-[#F59E0B]",
            },
            {
              step: "03",
              title: "Manage & Export",
              desc: "Edit every detail, track vendors, update tasks, and export your plan.",
              icon: Download,
              color: "from-[#F59E0B] to-[#10B981]",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="text-center space-y-3">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto shadow-md`}
                >
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
  );
}
