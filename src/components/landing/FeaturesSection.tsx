import {
  IndianRupee,
  CalendarDays,
  Store,
  Sparkles,
  ListTodo,
  Download,
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

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 px-4 bg-[#F9FAFB]">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Everything you need to plan perfectly
          </h2>
          <p className="text-gray-500">
            One platform. Every feature you need to organize a beautiful celebration.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow space-y-3"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${feat.color} flex items-center justify-center`}
                >
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
  );
}
