import Link from "next/link";
import { PartyPopper, CheckCircle2 } from "lucide-react";

export function CtaBanner() {
  return (
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
  );
}
