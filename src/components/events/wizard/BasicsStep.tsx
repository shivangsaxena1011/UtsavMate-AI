import React from "react";
import { Calendar } from "lucide-react";
import { NewEventFormData, EVENT_TYPES } from "@/hooks/useNewEventForm";

export interface BasicsStepProps {
  formData: NewEventFormData;
  updateField: (field: keyof NewEventFormData, value: string) => void;
}

export function BasicsStep({ formData, updateField }: BasicsStepProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#7C3AED]" /> Event Basics
      </h2>

      <div className="space-y-1.5">
        <label htmlFor="event-title" className="text-sm font-semibold text-gray-700">
          Event Title *
        </label>
        <input
          id="event-title"
          type="text"
          placeholder="e.g. Sharma Wedding Reception"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label id="event-type-label" className="text-sm font-semibold text-gray-700">
          Event Type *
        </label>
        <div
          role="radiogroup"
          aria-labelledby="event-type-label"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
        >
          {EVENT_TYPES.map((et) => (
            <button
              key={et.value}
              type="button"
              role="radio"
              aria-checked={formData.eventType === et.value}
              onClick={() => updateField("eventType", et.value)}
              className={`relative p-3.5 rounded-xl border-2 text-left transition-all ${
                formData.eventType === et.value
                  ? "border-[#7C3AED] bg-[#EDE9FE]"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <span className="text-xl">{et.emoji}</span>
              <p
                className={`text-xs font-bold mt-1 ${
                  formData.eventType === et.value ? "text-[#7C3AED]" : "text-gray-700"
                }`}
              >
                {et.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{et.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="event-date" className="text-sm font-semibold text-gray-700">
          Event Date *
        </label>
        <input
          id="event-date"
          type="date"
          value={formData.eventDate}
          min={todayStr}
          onChange={(e) => updateField("eventDate", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
        />
      </div>
    </div>
  );
}
