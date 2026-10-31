/**
 * @file AddBudgetModal.tsx
 * @module components/events/modals/AddBudgetModal
 * @description Accessible dialog modal for adding a new expense line item to the event budget.
 * Supports keyboard navigation (ESC key dismissal) and strict Zod category validation.
 */

import { useState, useEffect } from "react";
import { BudgetItem, BudgetCategory, BudgetCategoryEnum } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/engines/budget";

/**
 * Props for the AddBudgetModal component.
 */
export interface AddBudgetModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback invoked to close the modal */
  onClose: () => void;
  /** Async callback invoked upon submitting the new budget item */
  onSubmit: (item: Partial<BudgetItem>) => Promise<void>;
}

export function AddBudgetModal({ isOpen, onClose, onSubmit }: AddBudgetModalProps) {
  const [category, setCategory] = useState<BudgetCategory>("venue");
  const [name, setName] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
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
        name,
        estimatedAmount,
        actualAmount: 0,
        status: "planned",
      });
      setName("");
      setEstimatedAmount(0);
      setCategory("venue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-budget-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
      >
        <h3 id="add-budget-title" className="font-bold text-gray-900 text-lg">
          Add Budget Item
        </h3>
        <div>
          <label htmlFor="budget-category" className="text-xs font-semibold text-gray-500">
            Category
          </label>
          <select
            id="budget-category"
            value={category}
            onChange={(e) => {
              const parsed = BudgetCategoryEnum.safeParse(e.target.value);
              if (parsed.success) {
                setCategory(parsed.data);
              }
            }}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED] bg-white"
          >
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="budget-item-name" className="text-xs font-semibold text-gray-500">
            Item Name
          </label>
          <input
            id="budget-item-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Live Chaat Counter"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
        <div>
          <label htmlFor="budget-estimated-amount" className="text-xs font-semibold text-gray-500">
            Estimated Amount (₹)
          </label>
          <input
            id="budget-estimated-amount"
            type="number"
            min={0}
            required
            value={estimatedAmount || ""}
            onChange={(e) => setEstimatedAmount(Number(e.target.value))}
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
            {submitting ? "Adding..." : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
