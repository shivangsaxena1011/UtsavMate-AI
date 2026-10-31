import Link from "next/link";
import { Compass, LayoutDashboard, PlusCircle, Home } from "lucide-react";

export default function RootNotFound() {
  return (
    <main
      role="main"
      className="min-h-screen bg-gradient-to-br from-[#FAF5FF] via-white to-[#FDF2F8] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border border-purple-100 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7C3AED] shadow-inner">
          <Compass className="w-8 h-8 animate-pulse" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-5xl font-black bg-gradient-to-r from-[#7C3AED] to-[#EC4899] bg-clip-text text-transparent">
            404
          </span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Celebration Route Not Found
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            The page or celebration link you are looking for has moved, expired, or hasn&apos;t been planned yet. Let&apos;s guide you back to your festivities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-purple-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            Go to Dashboard
          </Link>

          <Link
            href="/events/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#EC4899] to-[#7C3AED] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:opacity-90"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            Plan New Event
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
    </main>
  );
}
