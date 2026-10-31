import React from "react";
import { ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { WizardStep } from "@/hooks/useNewEventForm";

export interface WizardNavProps {
  step: WizardStep;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardNav({
  step,
  loading,
  onBack,
  onNext,
  onSubmit,
}: WizardNavProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      ) : (
        <div />
      )}

      {step < 3 ? (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] shadow-md hover:shadow-lg transition-all"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Creating Plan…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate AI Plan
            </>
          )}
        </button>
      )}
    </div>
  );
}
