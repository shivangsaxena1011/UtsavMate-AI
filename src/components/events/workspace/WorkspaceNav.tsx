import React from "react";
import { Info, IndianRupee, Clock, Store, Sparkles, Download } from "lucide-react";
import { TabType } from "@/hooks/useEventWorkspace";

export interface WorkspaceNavProps {
  activeTab: TabType;
  onSwitchTab: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "budget", label: "Budget", icon: IndianRupee },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "ai", label: "AI Ideas", icon: Sparkles },
  { id: "export", label: "Export", icon: Download },
];

export function WorkspaceNav({ activeTab, onSwitchTab }: WorkspaceNavProps) {
  return (
    <div
      role="tablist"
      aria-label="Event workspace sections"
      className="px-6 border-t border-gray-100 flex overflow-x-auto scrollbar-hide gap-1 py-2 no-print"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSwitchTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "bg-[#7C3AED] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
