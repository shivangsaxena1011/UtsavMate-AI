"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PartyPopper, Calendar, Users, IndianRupee, MapPin,
  Globe, Sparkles, ChevronRight, ChevronLeft, Loader2, CheckCircle2
} from "lucide-react";

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding", emoji: "💍", desc: "Receptions, ceremonies, and celebrations" },
  { value: "birthday", label: "Birthday", emoji: "🎂", desc: "Milestone parties and celebrations" },
  { value: "anniversary", label: "Anniversary", emoji: "💑", desc: "Romantic milestones and renewals" },
  { value: "college_event", label: "College Event", emoji: "🎓", desc: "Fests, farewells, and fresher parties" },
  { value: "community", label: "Community Event", emoji: "🏘️", desc: "Local festivals and gatherings" },
  { value: "custom", label: "Custom Event", emoji: "✨", desc: "Any other celebration" },
];

const LANG_OPTIONS = [
  { value: "english", label: "English", flag: "🇬🇧" },
  { value: "hindi", label: "हिंदी", flag: "🇮🇳" },
  { value: "hinglish", label: "Hinglish", flag: "🎉" },
];

const STEP_LABELS = ["Event Basics", "Requirements", "Preferences"];

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    eventType: "",
    eventDate: "",
    city: "",
    guestCount: "",
    totalBudget: "",
    theme: "",
    dietaryRequirements: "",
    accessibilityNeeds: "",
    culturalPreferences: "",
    additionalNotes: "",
    preferredLanguage: "english",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.title.trim()) return "Event title is required.";
      if (!form.eventType) return "Please select an event type.";
      if (!form.eventDate) return "Event date is required.";
    }
    if (step === 2) {
      if (!form.city.trim()) return "City is required.";
      if (!form.guestCount || isNaN(Number(form.guestCount)) || Number(form.guestCount) < 1)
        return "Enter a valid guest count.";
      if (!form.totalBudget || isNaN(Number(form.totalBudget)) || Number(form.totalBudget) < 1000)
        return "Enter a valid budget (min ₹1,000).";
    }
    return "";
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, 3));
  };
  const back = () => { setError(""); setStep((s) => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
          totalBudget: Number(form.totalBudget),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create event");
      }
      const data = await res.json();
      const newEventId = data.plan?.event?.id || data.event?.id;
      if (!newEventId) {
        throw new Error("Event was created but no ID was returned.");
      }
      router.push(`/events/${newEventId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-xs font-semibold">
          <PartyPopper className="w-3.5 h-3.5" />
          Create New Event
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Plan Your Celebration</h1>
        <p className="text-gray-500 text-sm">Fill in the details and let AI create your personalized plan</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done ? "bg-[#10B981] text-white" :
                active ? "bg-[#7C3AED] text-white shadow-md" :
                "bg-gray-100 text-gray-400"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
              <span className={`text-xs font-medium ${active ? "text-[#7C3AED]" : "text-gray-400"}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7C3AED]" /> Event Basics
            </h2>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Event Title *</label>
              <input
                type="text"
                placeholder="e.g. Sharma Wedding Reception"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Event Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {EVENT_TYPES.map((et) => (
                  <button
                    key={et.value}
                    type="button"
                    onClick={() => set("eventType", et.value)}
                    className={`relative p-3.5 rounded-xl border-2 text-left transition-all ${
                      form.eventType === et.value
                        ? "border-[#7C3AED] bg-[#EDE9FE]"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <span className="text-xl">{et.emoji}</span>
                    <p className={`text-xs font-bold mt-1 ${form.eventType === et.value ? "text-[#7C3AED]" : "text-gray-700"}`}>
                      {et.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{et.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Event Date *</label>
              <input
                type="date"
                value={form.eventDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("eventDate", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#EC4899]" /> Requirements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" /> City / Venue *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bhopal, Madhya Pradesh"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> Guest Count *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 250"
                  min={1}
                  value={form.guestCount}
                  onChange={(e) => set("guestCount", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-gray-400" /> Total Budget (₹) *
              </label>
              <input
                type="number"
                placeholder="e.g. 400000"
                min={1000}
                value={form.totalBudget}
                onChange={(e) => set("totalBudget", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
              />
              {form.totalBudget && !isNaN(Number(form.totalBudget)) && Number(form.totalBudget) > 0 && (
                <p className="text-xs text-[#7C3AED] font-medium">
                  ≈ ₹{Number(form.totalBudget).toLocaleString("en-IN")} total budget
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Preferred Theme / Style</label>
              <input
                type="text"
                placeholder="e.g. Royal Rajasthani, Minimalist Modern, Boho Garden"
                value={form.theme}
                onChange={(e) => set("theme", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Dietary Requirements</label>
              <input
                type="text"
                placeholder="e.g. Vegetarian only, Jain food, Vegan options"
                value={form.dietaryRequirements}
                onChange={(e) => set("dietaryRequirements", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F59E0B]" /> Preferences & Notes
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gray-400" /> Preferred Language for AI Plan
              </label>
              <div className="flex gap-2">
                {LANG_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => set("preferredLanguage", lang.value)}
                    className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.preferredLanguage === lang.value
                        ? "border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]"
                        : "border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Accessibility Needs</label>
              <input
                type="text"
                placeholder="e.g. Wheelchair access, Sign language interpreter"
                value={form.accessibilityNeeds}
                onChange={(e) => set("accessibilityNeeds", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Cultural / Personal Preferences</label>
              <input
                type="text"
                placeholder="e.g. No alcohol, eco-friendly decor, live classical music"
                value={form.culturalPreferences}
                onChange={(e) => set("culturalPreferences", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Additional Notes</label>
              <textarea
                placeholder="Anything else you'd like the AI to know…"
                value={form.additionalNotes}
                onChange={(e) => set("additionalNotes", e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors resize-none"
              />
            </div>

            {/* Summary card */}
            <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plan Summary</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <div><span className="text-gray-400">Event: </span><span className="font-semibold text-gray-800">{form.title}</span></div>
                <div><span className="text-gray-400">Type: </span><span className="font-semibold text-gray-800 capitalize">{form.eventType.replace("_", " ")}</span></div>
                <div><span className="text-gray-400">Date: </span><span className="font-semibold text-gray-800">{form.eventDate}</span></div>
                <div><span className="text-gray-400">City: </span><span className="font-semibold text-gray-800">{form.city}</span></div>
                <div><span className="text-gray-400">Guests: </span><span className="font-semibold text-gray-800">{form.guestCount}</span></div>
                <div><span className="text-gray-400">Budget: </span><span className="font-semibold text-gray-800">₹{Number(form.totalBudget).toLocaleString("en-IN")}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] shadow-md hover:shadow-lg transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Plan…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Plan</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
