/**
 * @file useNewEventForm.ts
 * @module hooks/useNewEventForm
 * @description Custom React hook managing the multi-step event wizard form state,
 * input validation, step progression, and backend API submission without type assertions.
 */

import { useState } from "react";

/**
 * Valid step indicators for the new event creation wizard.
 */
export type WizardStep = 1 | 2 | 3;

/**
 * Event type selection card descriptor.
 */
export interface EventTypeOption {
  value: string;
  label: string;
  emoji: string;
  desc: string;
}

/**
 * Language selection descriptor.
 */
export interface LanguageOption {
  value: string;
  label: string;
  flag: string;
}

/**
 * Supported celebration event types with metadata.
 */
export const EVENT_TYPES: readonly EventTypeOption[] = [
  { value: "wedding", label: "Wedding", emoji: "💍", desc: "Receptions, ceremonies, and celebrations" },
  { value: "birthday", label: "Birthday", emoji: "🎂", desc: "Milestone parties and celebrations" },
  { value: "anniversary", label: "Anniversary", emoji: "💑", desc: "Romantic milestones and renewals" },
  { value: "college_fest", label: "College Event / Fest", emoji: "🎓", desc: "Fests, farewells, and fresher parties" },
  { value: "community", label: "Community Event", emoji: "🏘️", desc: "Local festivals and gatherings" },
  { value: "custom", label: "Custom Event", emoji: "✨", desc: "Any other celebration" },
];

/**
 * Supported language options with display labels.
 */
export const LANG_OPTIONS: readonly LanguageOption[] = [
  { value: "english", label: "English", flag: "🇬🇧" },
  { value: "hindi", label: "हिंदी", flag: "🇮🇳" },
  { value: "hinglish", label: "Hinglish", flag: "🎉" },
];

/**
 * Wizard step title labels.
 */
export const STEP_LABELS = ["Event Basics", "Requirements", "Preferences"] as const;

/**
 * Form state values captured across the three wizard steps.
 */
export interface NewEventFormData {
  title: string;
  eventType: string;
  eventDate: string;
  city: string;
  guestCount: string;
  totalBudget: string;
  theme: string;
  dietaryRequirements: string;
  accessibilityNeeds: string;
  culturalPreferences: string;
  additionalNotes: string;
  preferredLanguage: string;
}

export const INITIAL_FORM_DATA: NewEventFormData = {
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
};

/**
 * Return signature of useNewEventForm.
 */
export interface UseNewEventFormResult {
  step: WizardStep;
  formData: NewEventFormData;
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  updateField: (field: keyof NewEventFormData, value: string) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  setStepDirectly: (step: WizardStep) => void;
  submitForm: () => Promise<string | null>;
}

/**
 * Pure transition helper to advance wizard step with type safety.
 */
function stepForward(current: WizardStep): WizardStep {
  if (current === 1) return 2;
  return 3;
}

/**
 * Pure transition helper to retreat wizard step with type safety.
 */
function stepBackward(current: WizardStep): WizardStep {
  if (current === 3) return 2;
  return 1;
}

/**
 * Custom hook to manage the New Event creation wizard form state,
 * validation, step progression, and backend submission.
 */
export function useNewEventForm(): UseNewEventFormResult {
  const [step, setStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<NewEventFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof NewEventFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (currentStep: WizardStep = step): string | null => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) {
        errors.title = "Event title is required.";
      }
      if (!formData.eventType) {
        errors.eventType = "Please select an event type.";
      }
      if (!formData.eventDate) {
        errors.eventDate = "Event date is required.";
      }
    } else if (currentStep === 2) {
      if (!formData.city.trim()) {
        errors.city = "City is required.";
      }
      const count = Number(formData.guestCount);
      if (!formData.guestCount || isNaN(count) || count < 1) {
        errors.guestCount = "Enter a valid guest count.";
      }
      const budget = Number(formData.totalBudget);
      if (!formData.totalBudget || isNaN(budget) || budget < 1000) {
        errors.totalBudget = "Enter a valid budget (min ₹1,000).";
      }
    }

    setValidationErrors(errors);
    const firstErrorMessage = Object.values(errors)[0] || null;
    return firstErrorMessage;
  };

  const nextStep = (): boolean => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return false;
    }
    setError(null);
    setStep(stepForward);
    return true;
  };

  const prevStep = (): void => {
    setError(null);
    setStep(stepBackward);
  };

  const setStepDirectly = (targetStep: WizardStep): void => {
    setError(null);
    setStep(targetStep);
  };

  const submitForm = async (): Promise<string | null> => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        eventType: formData.eventType === "college_event" ? "college_fest" : formData.eventType,
        language:
          formData.preferredLanguage === "hindi"
            ? "hi"
            : formData.preferredLanguage === "hinglish"
            ? "hinglish"
            : "en",
        guestCount: Number(formData.guestCount),
        totalBudget: Number(formData.totalBudget),
        dietaryPreferences: formData.dietaryRequirements,
        notes: formData.additionalNotes,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create event");
      }

      const data = await res.json();
      const newEventId: string | undefined = data.plan?.event?.id || data.event?.id;

      if (!newEventId) {
        throw new Error("Event was created but no ID was returned.");
      }

      return newEventId;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    formData,
    loading,
    error,
    validationErrors,
    updateField,
    nextStep,
    prevStep,
    setStepDirectly,
    submitForm,
  };
}
