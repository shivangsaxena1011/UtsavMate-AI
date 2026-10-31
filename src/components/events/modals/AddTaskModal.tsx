/**
 * @file AddTaskModal.tsx
 * @module components/events/modals/AddTaskModal
 * @description Accessible dialog modal for adding a new planning task to the event roadmap.
 * Supports keyboard navigation (ESC key dismissal) and strict Zod priority validation.
 */

import { useState, useEffect } from "react";
import { TimelineTask, TaskPriority, TaskPriorityEnum } from "@/lib/types";

/**
 * Props for the AddTaskModal component.
 */
export interface AddTaskModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback invoked to close the modal */
  onClose: () => void;
  /** Async callback invoked upon submitting the new task */
  onSubmit: (task: Partial<TimelineTask>) => Promise<void>;
}

export function AddTaskModal({ isOpen, onClose, onSubmit }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<TaskPriority>("medium");
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
        title,
        description: "",
        category: "General",
        dueDate,
        priority,
        status: "pending",
      });
      setTitle("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setPriority("medium");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
      >
        <h3 id="add-task-title" className="font-bold text-gray-900 text-lg">
          Add Task
        </h3>
        <div>
          <label htmlFor="task-title-input" className="text-xs font-semibold text-gray-500">
            Task Title
          </label>
          <input
            id="task-title-input"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Book Mehndi Artist"
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
        <div>
          <label htmlFor="task-due-date-input" className="text-xs font-semibold text-gray-500">
            Due Date
          </label>
          <input
            id="task-due-date-input"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
        <div>
          <label htmlFor="task-priority-select" className="text-xs font-semibold text-gray-500">
            Priority
          </label>
          <select
            id="task-priority-select"
            value={priority}
            onChange={(e) => {
              const parsed = TaskPriorityEnum.safeParse(e.target.value);
              if (parsed.success) {
                setPriority(parsed.data);
              }
            }}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#7C3AED]"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
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
            {submitting ? "Adding..." : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
