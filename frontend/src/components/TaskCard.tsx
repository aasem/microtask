import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Calendar, Edit, Trash2, AlertCircle, Clock, Tag, User } from "lucide-react";
import { Task } from "../services/taskService";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: TaskCardProps) => {
  const navigate = useNavigate();

  const isOverdue =
    task.due_date &&
    new Date(task.due_date) < new Date() &&
    task.status !== "completed";

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    navigate(`/tasks/${task.id}`);
  };

  // Get status-based dot color (overdue overrides status)
  const getStatusDotColor = () => {
    // Overdue tasks should be red regardless of status
    if (isOverdue && task.status !== "completed") {
      return "bg-red-700";
    }
    switch (task.status) {
      case "completed":
        return "bg-green-700";
      case "in_progress":
        return "bg-blue-700";
      case "suspended":
        return "bg-red-700";
      default:
        return "bg-blue-700";
    }
  };

  // Get status-based text color (overdue overrides status)
  const getStatusTextColor = (status: string) => {
    // Overdue tasks should be red regardless of status
    if (isOverdue && status !== "completed") {
      return "text-red-700";
    }
    switch (status) {
      case "completed":
        return "text-green-700";
      case "in_progress":
        return "text-blue-700";
      case "suspended":
        return "text-red-700";
      default:
        return "text-blue-700";
    }
  };

  // Get status-based background and border color (overdue overrides status)
  const getStatusCardColor = () => {
    // Overdue tasks should be red regardless of status
    if (isOverdue && task.status !== "completed") {
      return "bg-red-50 border-l-red-700";
    }
    switch (task.status) {
      case "completed":
        return "bg-green-50 border-l-green-700";
      case "in_progress":
        return "bg-blue-50 border-l-blue-700";
      case "suspended":
        return "bg-red-50 border-l-red-700";
      default:
        return "bg-blue-50 border-l-blue-700";
    }
  };

  // Get status-based tag colors (overdue overrides status)
  const getStatusTagColor = () => {
    // Overdue tasks should be red regardless of status
    if (isOverdue && task.status !== "completed") {
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-700",
        icon: "text-red-700"
      };
    }
    switch (task.status) {
      case "completed":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-700",
          icon: "text-green-700"
        };
      case "in_progress":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-700",
          icon: "text-blue-700"
        };
      case "suspended":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-700",
          icon: "text-red-700"
        };
      default:
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-700",
          icon: "text-blue-700"
        };
    }
  };

  return (
    <div
      className={`card custom-card shadow-card hover:border-gray-300 cursor-pointer py-3 border-l-4 ${getStatusCardColor()} pl-4`}
      onClick={handleCardClick}
    >
      {/* Task Content Layout */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Status Dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor()} flex-shrink-0 mt-1`}
          />
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title Section */}
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className={`text-lg font-bold ${getStatusTextColor(task.status)} break-words flex-1 min-w-0`}>
                {task.title}
              </h3>
              {isOverdue && (
                <span title="Overdue" className="text-red-700 flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Description Section */}
            {task.description && (
              <p className={`text-xs break-words line-clamp-3 opacity-80 ${getStatusTextColor(task.status)}`}>
                {task.description}
              </p>
            )}

            {/* Metadata Section - 2 rows grid */}
            <div className={`grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs ${getStatusTextColor(task.status)} mt-2 pt-2 border-t border-gray-200 border-opacity-30`}>
              {task.assigned_to_div_name && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="w-3 h-3 opacity-60 flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Assign To:</span>
                  <span className="truncate">{task.assigned_to_div_name}</span>
                </div>
              )}
              {task.assignment_date && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">Created:</span>
                  <span className="truncate">{format(new Date(task.assignment_date), "dd/MM/yyyy")}</span>
                </div>
              )}
              {task.due_date && (
                <div
                  className={`flex items-center gap-1.5 min-w-0 ${
                    isOverdue ? "text-red-700" : ""
                  }`}
                >
                  <Calendar
                    className={`w-3 h-3 flex-shrink-0 ${
                      isOverdue ? "text-red-700" : "opacity-60"
                    }`}
                  />
                  <span className="font-medium flex-shrink-0">Due:</span>
                  <span className={`truncate ${isOverdue ? "font-semibold" : ""}`}>
                    {format(new Date(task.due_date), "dd/MM/yyyy, HH:mm")}
                  </span>
                </div>
              )}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag className={`w-3 h-3 opacity-70 flex-shrink-0 ${getStatusTagColor().icon}`} />
                  <div className="flex gap-1 flex-wrap min-w-0">
                    {task.tags.map((tag) => {
                      const tagColors = getStatusTagColor();
                      return (
                        <span
                          key={tag.id}
                          className={`badge ${tagColors.bg} ${tagColors.text} border ${tagColors.border} border-opacity-30 text-xs px-1.5 py-0.5 flex-shrink-0`}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 flex-shrink-0">
          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              className="icon-wrapper icon-accent rounded-md"
              title="Edit task"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="icon-wrapper icon-danger rounded-md"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Priority, Status, and Other Metadata - Compact Row */}
      {/* <div className="ml-6 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`badge ${getPriorityColor(
            task.priority
          )} text-xs px-2 py-0.5`}
        >
          {task.priority}
        </span>
        <span
          className={`badge ${getStatusColor(task.status)} text-xs px-2 py-0.5`}
        >
          {task.status.replace("_", " ")}
        </span>
        {task.assigned_to_name && (
          <div className="flex items-center gap-1 text-gray-500">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[100px]">
              {task.assigned_to_name}
            </span>
          </div>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="text-gray-500">
            <span className="font-medium">
              {task.subtasks.filter((s) => s.status === "completed").length}/
              {task.subtasks.length}
            </span>
            <span className="ml-1">subtasks</span>
          </div>
        )}
      </div> */}
    </div>
  );
};

export default TaskCard;
