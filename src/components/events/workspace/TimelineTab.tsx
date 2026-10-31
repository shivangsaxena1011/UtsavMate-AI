import { Plus, Check } from "lucide-react";
import { TimelineTask } from "@/lib/types";
import { TaskFilterType } from "@/hooks/useEventWorkspace";

export interface TimelineTabProps {
  tasks: TimelineTask[];
  filteredTasks: TimelineTask[];
  taskFilter: TaskFilterType;
  setTaskFilter: (filter: TaskFilterType) => void;
  completedTasks: number;
  eventDate: string;
  onOpenAddTaskModal: () => void;
  onToggleTask: (task: TimelineTask) => Promise<void>;
}

export function TimelineTab({
  tasks,
  filteredTasks,
  taskFilter,
  setTaskFilter,
  completedTasks,
  eventDate,
  onOpenAddTaskModal,
  onToggleTask,
}: TimelineTabProps) {
  return (
    <div
      role="tabpanel"
      id="tabpanel-timeline"
      aria-labelledby="tab-timeline"
      tabIndex={0}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Timeline & Tasks</h2>
          <p className="text-sm text-gray-500">
            {completedTasks}/{tasks.length} completed • Event Date: {eventDate}
          </p>
        </div>
        <button
          onClick={onOpenAddTaskModal}
          className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["All Tasks", "Pending", "Completed", "Overdue"] as const).map((filter) => {
          const active = taskFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setTaskFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            No tasks match the &ldquo;{taskFilter}&rdquo; filter.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 transition-all ${
                task.status === "completed"
                  ? "border-[#D1FAE5] bg-[#F0FDF4]"
                  : task.isOverdue
                  ? "border-red-200 bg-red-50"
                  : "border-gray-100"
              }`}
            >
              <button
                onClick={() => onToggleTask(task)}
                aria-label={
                  task.status === "completed"
                    ? `Mark ${task.title} as pending`
                    : `Mark ${task.title} as completed`
                }
                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  task.status === "completed"
                    ? "bg-[#10B981] border-[#10B981]"
                    : "border-gray-300 hover:border-[#7C3AED]"
                }`}
              >
                {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-bold ${
                      task.status === "completed" ? "line-through text-gray-400" : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{task.category}</span>
                  {task.isOverdue && task.status !== "completed" && (
                    <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">OVERDUE</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{task.description}</p>
                <p className="text-xs text-gray-400">Due: {task.dueDate}</p>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  task.priority === "high"
                    ? "bg-red-100 text-red-600"
                    : task.priority === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {task.priority.toUpperCase()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
