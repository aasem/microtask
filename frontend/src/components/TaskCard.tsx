import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Calendar, Edit, Trash2, AlertCircle, Clock, Tag } from "lucide-react";
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
  const [isHovered, setIsHovered] = useState(false);

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

  // Status dot color
  const getStatusDotClass = (status: string) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "in_progress":
        return "status-in-progress";
      case "suspended":
        return "status-suspended";
      default:
        return "status-not-started";
    }
  };

  return (
    <div
      className={`card custom-card shadow-card hover:border-gray-300 cursor-pointer bg-gradient-to-br from-white to-gray-50 py-3 ${
        isOverdue ? "border-l-4 border-l-danger pl-4" : "pl-5"
      }`}
      onClick={handleCardClick}
    >
      {/* Compact Single Line Layout */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status Dot and Title */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`status-dot ${getStatusDotClass(
                task.status
              )} flex-shrink-0`}
            />
            <div
              className="relative w-80 overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <h3
                className={`text-lg font-semibold text-gray-900 transition-transform duration-1000 ease-linear ${
                  isHovered
                    ? "whitespace-nowrap animate-marquee-simple"
                    : "truncate"
                }`}
              >
                {task.title}
              </h3>
            </div>
            {isOverdue && (
              <span title="Overdue" className="text-danger flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Metadata in single line */}
          <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
            {task.assignment_date && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="font-medium">Created:</span>
                <span>{format(new Date(task.assignment_date), "MMM dd")}</span>
              </div>
            )}
            {task.due_date && (
              <div
                className={`flex items-center gap-1 ${
                  isOverdue ? "text-danger" : ""
                }`}
              >
                <Calendar
                  className={`w-3 h-3 ${
                    isOverdue ? "text-danger" : "text-gray-400"
                  }`}
                />
                <span className="font-medium">Due:</span>
                <span className={isOverdue ? "font-semibold" : ""}>
                  {format(new Date(task.due_date), "MMM dd, HH:mm")}
                </span>
              </div>
            )}
          </div>

          {/* Tags inline */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Tag className="w-3 h-3 text-accent" />
              <div className="flex gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="badge bg-accent bg-opacity-10 text-accent border border-accent border-opacity-30 text-xs px-1.5 py-0.5"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
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
