"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, LayoutDashboard } from "lucide-react";

interface RootErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorBoundaryProps) {
  useEffect(() => {
    console.error("[RootError] Unhandled error captured by root boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF5FF] via-white to-[#FDF2F8] flex items-center justify-center p-6">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-lg bg-white rounded-3xl border border-purple-100 shadow-xl p-8 text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-100 to-amber-100 border border-red-200 flex items-center justify-center text-red-600 shadow-inner">
          <AlertTriangle className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Unexpected Celebration Hiccup
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Don&apos;t worry — your event data in storage remains completely safe. A temporary issue occurred while rendering this page.
          </p>
        </div>

        {error.digest && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-500 break-all">
            Reference Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-purple-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            Dashboard
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-gray-500 hover:text-gray-800 px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
