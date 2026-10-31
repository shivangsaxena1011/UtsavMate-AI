import React from "react";
import { Sparkles, Globe } from "lucide-react";
import { NewEventFormData, LANG_OPTIONS } from "@/hooks/useNewEventForm";

export interface PreferencesStepProps {
  formData: NewEventFormData;
  updateField: (field: keyof NewEventFormData, value: string) => void;
}

export function PreferencesStep({ formData, updateField }: PreferencesStepProps) {
  const formattedBudget = Number(formData.totalBudget)
    ? Number(formData.totalBudget).toLocaleString("en-IN")
    : "0";

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#F59E0B]" /> Preferences & Notes
      </h2>

      <div className="space-y-2">
        <label id="preferred-language-label" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-gray-400" /> Preferred Language for AI Plan
        </label>
        <div
          role="radiogroup"
          aria-labelledby="preferred-language-label"
          className="flex gap-2"
        >
          {LANG_OPTIONS.map((lang) => (
            <button
              key={lang.value}
              type="button"
              role="radio"
              aria-checked={formData.preferredLanguage === lang.value}
              onClick={() => updateField("preferredLanguage", lang.value)}
              className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                formData.preferredLanguage === lang.value
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
        <label htmlFor="event-accessibility" className="text-sm font-semibold text-gray-700">
          Accessibility Needs
        </label>
        <input
          id="event-accessibility"
          type="text"
          placeholder="e.g. Wheelchair access, Sign language interpreter"
          value={formData.accessibilityNeeds}
          onChange={(e) => updateField("accessibilityNeeds", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="event-cultural" className="text-sm font-semibold text-gray-700">
          Cultural / Personal Preferences
        </label>
        <input
          id="event-cultural"
          type="text"
          placeholder="e.g. No alcohol, eco-friendly decor, live classical music"
          value={formData.culturalPreferences}
          onChange={(e) => updateField("culturalPreferences", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="event-notes" className="text-sm font-semibold text-gray-700">
          Additional Notes
        </label>
        <textarea
          id="event-notes"
          placeholder="Anything else you'd like the AI to know…"
          value={formData.additionalNotes}
          onChange={(e) => updateField("additionalNotes", e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors resize-none"
        />
      </div>

      {/* Summary card */}
      <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2 border border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Plan Summary</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div>
            <span className="text-gray-400">Event: </span>
            <span className="font-semibold text-gray-800">{formData.title || "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">Type: </span>
            <span className="font-semibold text-gray-800 capitalize">
              {formData.eventType ? formData.eventType.replace("_", " ") : "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Date: </span>
            <span className="font-semibold text-gray-800">{formData.eventDate || "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">City: </span>
            <span className="font-semibold text-gray-800">{formData.city || "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">Guests: </span>
            <span className="font-semibold text-gray-800">{formData.guestCount || "—"}</span>
          </div>
          <div>
            <span className="text-gray-400">Budget: </span>
            <span className="font-semibold text-gray-800">₹{formattedBudget}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
