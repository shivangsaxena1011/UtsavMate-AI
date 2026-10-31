import { Download, Printer } from "lucide-react";

export interface ExportTabProps {
  eventId: string;
}

export function ExportTab({ eventId }: ExportTabProps) {
  return (
    <div
      role="tabpanel"
      id="tabpanel-export"
      aria-labelledby="tab-export"
      tabIndex={0}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-900">Export & Share</h2>
        <p className="text-sm text-gray-500">Download or print your complete event plan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Markdown Plan", sub: "Full event dossier", format: "markdown", color: "bg-[#EDE9FE] text-[#7C3AED]", ext: ".md" },
          { label: "Budget CSV", sub: "Excel/Sheets compatible", format: "csv-budget", color: "bg-[#D1FAE5] text-[#065F46]", ext: ".csv" },
          { label: "Vendors CSV", sub: "Contact & quote tracking", format: "csv-vendors", color: "bg-[#FEF3C7] text-[#92400E]", ext: ".csv" },
          { label: "Calendar .ics", sub: "Sync to Google Calendar", format: "ics", color: "bg-[#FCE7F3] text-[#9D174D]", ext: ".ics" },
        ].map((item) => (
          <a
            key={item.format}
            href={`/api/events/${eventId}/export?format=${item.format}`}
            download
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#7C3AED]/30 transition-all flex flex-col gap-3 group"
          >
            <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center font-bold text-sm`}>
              {item.ext}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
            <div className="text-xs font-bold text-[#7C3AED] flex items-center gap-1 group-hover:underline">
              <Download className="w-3.5 h-3.5" /> Download
            </div>
          </a>
        ))}
      </div>

      {/* Print Button */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">Print Dossier</p>
          <p className="text-xs text-gray-400">Clean print-optimized layout for physical binders</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-[#1E1B4B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#312E81] transition-colors"
        >
          <Printer className="w-4 h-4" /> Print Plan
        </button>
      </div>
    </div>
  );
}
