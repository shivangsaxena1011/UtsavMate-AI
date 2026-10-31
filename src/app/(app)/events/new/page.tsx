"use client";

import { useRouter } from "next/navigation";
import { PartyPopper, CheckCircle2 } from "lucide-react";
import { useNewEventForm, STEP_LABELS } from "@/hooks/useNewEventForm";
import { BasicsStep } from "@/components/events/wizard/BasicsStep";
import { RequirementsStep } from "@/components/events/wizard/RequirementsStep";
import { PreferencesStep } from "@/components/events/wizard/PreferencesStep";
import { WizardNav } from "@/components/events/wizard/WizardNav";

export default function NewEventPage() {
  const router = useRouter();
  const {
    step,
    formData,
    loading,
    error,
    updateField,
    nextStep,
    prevStep,
    submitForm,
  } = useNewEventForm();

  const handleSubmit = async () => {
    const newEventId = await submitForm();
    if (newEventId) {
      router.push(`/events/${newEventId}`);
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
        <p className="text-gray-500 text-sm">
          Fill in the details and let AI create your personalized plan
        </p>
      </div>

      {/* Progress */}
      <div role="region" aria-label="Wizard Steps" className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = step > num;
          const active = step === num;
          return (
            <div
              key={label}
              className="flex-1 flex flex-col items-center gap-1"
              aria-current={active ? "step" : undefined}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? "bg-[#10B981] text-white"
                    : active
                    ? "bg-[#7C3AED] text-white shadow-md"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-[#7C3AED]" : "text-gray-400"
                }`}
              >
                {label}
              </span>
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

        {step === 1 && <BasicsStep formData={formData} updateField={updateField} />}
        {step === 2 && <RequirementsStep formData={formData} updateField={updateField} />}
        {step === 3 && <PreferencesStep formData={formData} updateField={updateField} />}

        <WizardNav
          step={step}
          loading={loading}
          onBack={prevStep}
          onNext={nextStep}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
