"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, LayoutDashboard, CalendarDays } from "lucide-react";

interface AppErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorBoundaryProps) {
  useEffect(() => {
    console.error("[AppError] Scoped app boundary captured exception:", error);
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-6"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
        <AlertOctagon className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
          Unable to Load Workspace Section
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          A temporary error interrupted this view. Your saved budget, tasks, and vendor contracts are fully preserved in storage.
        </p>
      </div>

      {error.digest && (
        <p className="text-xs font-mono text-gray-400 bg-gray-50 py-1.5 px-3 rounded-lg inline-block">
          Error code: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Retry View
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
          Dashboard
        </Link>

        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 px-4 py-2 text-sm font-medium transition-colors"
        >
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          All Events
        </Link>
      </div>
    </div>
  );
}
