/**
 * @file AddVendorModal.tsx
 * @module components/events/modals/AddVendorModal
 * @description Accessible dialog modal for adding a commercial vendor to an event plan.
 * Supports keyboard navigation (ESC key dismissal) and structured quote tracking.
 */

import { useState, useEffect } from "react";
import { Vendor } from "@/lib/types";

/**
 * Props for the AddVendorModal component.
 */
export interface AddVendorModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback invoked to close the modal */
  onClose: () => void;
  /** Async callback invoked upon submitting the new vendor */
  onSubmit: (vendor: Partial<Vendor>) => Promise<void>;
}

export function AddVendorModal({ isOpen, onClose, onSubmit }: AddVendorModalProps) {
  const [category, setCategory] = useState("Venue");
  const [businessName, setBusinessName] = useState("");
  const [estimatedQuote, setEstimatedQuote] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        category,
        businessName,
        estimatedQuote,
        finalQuote: 0,
        status: "not_contacted",
      });
      setCategory("Venue");
      setBusinessName("");
      setEstimatedQuote(0);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-vendor-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
      >
        <h3 id="add-vendor-title" className="font-bold text-gray-900 text-lg">
          Add Vendor
        </h3>
        <div>
          <label htmlFor="vendor-category-input" className="text-xs font-semibold text-gray-500">
            Category
          </label>
          <input
            id="vendor-category-input"
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Catering, Decor, Photography"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
        <div>
          <label htmlFor="vendor-name-input" className="text-xs font-semibold text-gray-500">
            Vendor Name
          </label>
          <input
            id="vendor-name-input"
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., Royal Caterers Bhopal"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
        <div>
          <label htmlFor="vendor-quote-input" className="text-xs font-semibold text-gray-500">
            Estimated Quote (₹)
          </label>
          <input
            id="vendor-quote-input"
            type="number"
            min={0}
            value={estimatedQuote || ""}
            onChange={(e) => setEstimatedQuote(Number(e.target.value))}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold hover:bg-[#6D28D9] disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Vendor"}
          </button>
        </div>
      </form>
    </div>
  );
}
