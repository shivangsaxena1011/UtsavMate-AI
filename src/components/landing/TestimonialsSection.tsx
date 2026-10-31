import { Star } from "lucide-react";

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

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 px-4 bg-[#F9FAFB]">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Loved by planners across India</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 hover:shadow-md transition-shadow"
            >
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
  );
}
