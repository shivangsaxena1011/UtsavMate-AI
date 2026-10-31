import React from "react";
import { Users, MapPin, IndianRupee } from "lucide-react";
import { NewEventFormData } from "@/hooks/useNewEventForm";

export interface RequirementsStepProps {
  formData: NewEventFormData;
  updateField: (field: keyof NewEventFormData, value: string) => void;
}

export function RequirementsStep({ formData, updateField }: RequirementsStepProps) {
  const numericBudget = Number(formData.totalBudget);
  const hasValidBudget = formData.totalBudget && !isNaN(numericBudget) && numericBudget > 0;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-5 h-5 text-[#EC4899]" /> Requirements
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="event-city" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" /> City / Venue *
          </label>
          <input
            id="event-city"
            type="text"
            placeholder="e.g. Bhopal, Madhya Pradesh"
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="event-guests" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" /> Guest Count *
          </label>
          <input
            id="event-guests"
            type="number"
            placeholder="e.g. 250"
            min={1}
            value={formData.guestCount}
            onChange={(e) => updateField("guestCount", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="event-budget" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <IndianRupee className="w-3.5 h-3.5 text-gray-400" /> Total Budget (₹) *
        </label>
        <input
          id="event-budget"
          type="number"
          placeholder="e.g. 400000"
          min={1000}
          value={formData.totalBudget}
          onChange={(e) => updateField("totalBudget", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
        />
        {hasValidBudget && (
          <p className="text-xs text-[#7C3AED] font-medium">
            ≈ ₹{numericBudget.toLocaleString("en-IN")} total budget
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="event-theme" className="text-sm font-semibold text-gray-700">
          Preferred Theme / Style
        </label>
        <input
          id="event-theme"
          type="text"
          placeholder="e.g. Royal Rajasthani, Minimalist Modern, Boho Garden"
          value={formData.theme}
          onChange={(e) => updateField("theme", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="event-dietary" className="text-sm font-semibold text-gray-700">
          Dietary Requirements
        </label>
        <input
          id="event-dietary"
          type="text"
          placeholder="e.g. Vegetarian only, Jain food, Vegan options"
          value={formData.dietaryRequirements}
          onChange={(e) => updateField("dietaryRequirements", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
        />
      </div>
    </div>
  );
}
