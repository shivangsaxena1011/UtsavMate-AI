"use client";

/**
 * @file page.tsx
 * @module app/(app)/events/[id]/page
 * @description Refactored thin orchestrating component for the event workspace.
 * Binds the useEventWorkspace hook with modular tab components, modal dialogs,
 * and resilient actionError alert banners.
 */

import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertTriangle } from "lucide-react";
import { useEventWorkspace } from "@/hooks/useEventWorkspace";
import { WorkspaceHeader } from "@/components/events/workspace/WorkspaceHeader";
import { WorkspaceNav } from "@/components/events/workspace/WorkspaceNav";
import { OverviewTab } from "@/components/events/workspace/OverviewTab";
import { BudgetTab } from "@/components/events/workspace/BudgetTab";
import { TimelineTab } from "@/components/events/workspace/TimelineTab";
import { VendorsTab } from "@/components/events/workspace/VendorsTab";
import { AIIdeasTab } from "@/components/events/workspace/AIIdeasTab";
import { ExportTab } from "@/components/events/workspace/ExportTab";
import { AddBudgetModal } from "@/components/events/modals/AddBudgetModal";
import { AddTaskModal } from "@/components/events/modals/AddTaskModal";
import { AddVendorModal } from "@/components/events/modals/AddVendorModal";

export default function EventWorkspacePage() {
  const params = useParams();
  const eventId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const workspace = useEventWorkspace(eventId);

  if (workspace.loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED]" />
        <p className="text-sm text-gray-500 font-medium">Loading your event workspace...</p>
      </div>
    );
  }

  if (workspace.error || !workspace.plan || !workspace.summary) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
        <h2 className="text-xl font-bold text-gray-900">Event Not Found</h2>
        <p className="text-sm text-gray-500">{workspace.error || "Event not found"}</p>
        <Link href="/dashboard" className="inline-flex bg-[#7C3AED] text-white px-4 py-2 rounded-xl font-semibold text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { plan, summary, activeTab, switchTab } = workspace;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <WorkspaceHeader plan={plan} onSwitchTab={switchTab} />
        <WorkspaceNav activeTab={activeTab} onSwitchTab={switchTab} />
      </div>

      {workspace.actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium">{workspace.actionError}</p>
          </div>
          <button
            type="button"
            onClick={workspace.clearActionError}
            className="text-xs font-semibold text-red-700 hover:text-red-900 px-2 py-1 rounded-lg hover:bg-red-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {summary.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Budget Alert</p>
            <ul className="mt-1 space-y-0.5 text-amber-700 list-disc list-inside">
              {summary.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <OverviewTab
          plan={plan}
          summary={summary}
          completedTasks={workspace.completedTasks}
          overdueTasks={workspace.overdueTasks}
          onSwitchTab={switchTab}
        />
      )}
      {activeTab === "budget" && (
        <BudgetTab
          plan={plan}
          summary={summary}
          onOpenAddBudgetModal={() => workspace.setIsBudgetModalOpen(true)}
          onUpdateBudgetItem={workspace.handleUpdateBudgetItem}
          onDeleteBudgetItem={workspace.handleDeleteBudgetItem}
        />
      )}
      {activeTab === "timeline" && (
        <TimelineTab
          tasks={plan.tasks}
          filteredTasks={workspace.filteredTasks}
          taskFilter={workspace.taskFilter}
          setTaskFilter={workspace.setTaskFilter}
          completedTasks={workspace.completedTasks}
          eventDate={plan.event.eventDate}
          onOpenAddTaskModal={() => workspace.setIsTaskModalOpen(true)}
          onToggleTask={workspace.handleToggleTask}
        />
      )}
      {activeTab === "vendors" && (
        <VendorsTab
          vendors={plan.vendors}
          filteredVendors={workspace.filteredVendors}
          vendorFilter={workspace.vendorFilter}
          setVendorFilter={workspace.setVendorFilter}
          onOpenAddVendorModal={() => workspace.setIsVendorModalOpen(true)}
          onUpdateVendor={workspace.handleUpdateVendor}
        />
      )}
      {activeTab === "ai" && (
        <AIIdeasTab
          ideas={plan.ideas}
          filteredIdeas={workspace.filteredIdeas}
          ideaFilter={workspace.ideaFilter}
          setIdeaFilter={workspace.setIdeaFilter}
          eventCity={plan.event.city}
          chatPrompt={workspace.chatPrompt}
          setChatPrompt={workspace.setChatPrompt}
          chatLoading={workspace.chatLoading}
          chatResponse={workspace.chatResponse}
          onRefineSubmit={workspace.handleRefineSubmit}
        />
      )}
      {activeTab === "export" && <ExportTab eventId={eventId} />}

      <AddBudgetModal
        isOpen={workspace.isBudgetModalOpen}
        onClose={() => workspace.setIsBudgetModalOpen(false)}
        onSubmit={workspace.handleAddBudgetItem}
      />
      <AddTaskModal
        isOpen={workspace.isTaskModalOpen}
        onClose={() => workspace.setIsTaskModalOpen(false)}
        onSubmit={workspace.handleAddTask}
      />
      <AddVendorModal
        isOpen={workspace.isVendorModalOpen}
        onClose={() => workspace.setIsVendorModalOpen(false)}
        onSubmit={workspace.handleAddVendor}
      />
    </div>
  );
}
