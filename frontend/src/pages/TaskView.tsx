import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  Clock,
  FileText,
  History as HistoryIcon,
  Edit,
  Download,
  File,
  Building2,
} from "lucide-react";
import { taskService, Task, TaskHistory } from "../services/taskService";
import { format } from "date-fns";
import TaskModal from "../components/TaskModal";
import Toast from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { useTaskStore } from "../store/taskStore";
import { canEditTask } from "../utils/roleUtils";
import { fileService } from "../services/fileService";

const TaskView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateTask } = useTaskStore();
  const [task, setTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchTaskData();
    }
  }, [id]);

  const fetchTaskData = async () => {
    try {
      setLoading(true);
      const [taskData, historyData] = await Promise.all([
        taskService.getTaskById(Number(id)),
        taskService.getTaskHistory(Number(id)),
      ]);
      setTask(taskData);
      setHistory(historyData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch task data");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = () => {
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!task) throw new Error("No task to update");

    try {
      const savedTask = await updateTask(task.id, taskData);
      setToast({ message: "Task updated successfully", type: "success" });
      setIsModalOpen(false);
      // Refresh task data after update
      await fetchTaskData();
      return savedTask;
    } catch (err) {
      setToast({ message: "Failed to update task", type: "error" });
      throw err;
    }
  };

  const handleFileDownload = async (fileId: number, filename: string) => {
    try {
      await fileService.downloadFile(fileId, filename);
    } catch (err) {
      setToast({ message: "Failed to download file", type: "error" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "blocked":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case "status_change":
        return <CheckCircle2 className="w-4 h-4" />;
      case "assignment_change":
        return <User className="w-4 h-4" />;
      case "tags_change":
        return <Tag className="w-4 h-4" />;
      case "due_date_change":
        return <Calendar className="w-4 h-4" />;
      case "subtask_added":
        return <CheckCircle2 className="w-4 h-4" />;
      case "notes_updated":
        return <FileText className="w-4 h-4" />;
      case "task_created":
        return <Clock className="w-4 h-4" />;
      default:
        return <HistoryIcon className="w-4 h-4" />;
    }
  };

  const formatChangeType = (changeType: string) => {
    return changeType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002B5B]"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || "Task not found"}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-primary transition-colors gap-2 py-2 px-4 rounded-lg bg-white border border-gray-200 hover:border-primary shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {user &&
          task &&
          canEditTask(user.role, task.assigned_to_div || 0, user.id) && (
            <button
              onClick={handleEditTask}
              className="btn-primary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Task</span>
            </button>
          )}
      </div>

      {/* Main Task Header Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Status Indicator Bar */}
        <div
          className={`h-1.5 ${
            task.status === "completed"
              ? "bg-green-500"
              : task.status === "in_progress"
              ? "bg-blue-500"
              : task.status === "blocked"
              ? "bg-red-500"
              : "bg-gray-400"
          }`}
        />

        <div className="p-6">
          {/* Title Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`status-dot w-2.5 h-2.5 ${
                  task.status === "completed"
                    ? "status-completed"
                    : task.status === "in_progress"
                    ? "status-in-progress"
                    : task.status === "blocked"
                    ? "status-blocked"
                    : "status-not-started"
                }`}
              />
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {task.title}
              </h1>
            </div>

            {/* Priority and Status Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span
                className={`badge ${getPriorityColor(task.priority)} border`}
              >
                {task.priority.toUpperCase()}
              </span>
              <span className={`badge ${getStatusColor(task.status)} border`}>
                {task.status.replace("_", " ").toUpperCase()}
              </span>
              {task.tags &&
                task.tags.length > 0 &&
                task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="badge bg-accent bg-opacity-10 text-accent border border-accent border-opacity-30"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name}
                  </span>
                ))}
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {task.assigned_to_div_name && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="p-2 rounded-lg bg-accent bg-opacity-10">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Division
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {task.assigned_to_div_name}
                  </p>
                  {task.assigned_to_div_email && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {task.assigned_to_div_email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {task.assigned_to_div_user_name && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="p-2 rounded-lg bg-primary bg-opacity-10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Assigned User
                  </p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {task.assigned_to_div_user_name}
                  </p>
                </div>
              </div>
            )}

            {task.due_date && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Due Date
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(task.due_date), "MMM dd, yyyy")}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(task.due_date), "HH:mm")}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="p-2 rounded-lg bg-gray-200">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Created
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(task.assignment_date), "MMM dd, yyyy")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  by {task.created_by_name || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-5 py-3 font-semibold text-sm transition-all relative flex items-center gap-2 ${
                activeTab === "details"
                  ? "text-primary bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              Task Details
              {activeTab === "details" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-5 py-3 font-semibold text-sm transition-all relative flex items-center gap-2 ${
                activeTab === "history"
                  ? "text-primary bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              History
              {activeTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
              <span
                className={`ml-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeTab === "history"
                    ? "bg-primary bg-opacity-10 text-primary"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {history.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "details" ? (
            <div className="space-y-4">
              {/* Description and Notes in Same Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Description Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-accent bg-opacity-10">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Description
                    </h3>
                  </div>
                  {task.description ? (
                    <div className="pl-8">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  ) : (
                    <div className="pl-8">
                      <p className="text-sm text-gray-500 italic">
                        No description provided
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                {task.notes ? (
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-primary bg-opacity-10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Notes</h3>
                    </div>
                    <div className="pl-8">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {task.notes}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Files Section */}
                  {task.files && task.files.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-100">
                            <File className="w-4 h-4 text-blue-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Attachments
                          </h3>
                        </div>
                        <span className="text-xs font-semibold bg-gray-200 text-gray-700 py-1 px-2 rounded-full">
                          {task.files.length}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="space-y-2">
                          {task.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="p-1.5 rounded-lg bg-white border border-gray-200">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {file.original_filename}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <span>
                                      {formatFileSize(file.file_size)}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      {format(
                                        new Date(file.created_at),
                                        "MMM dd, yyyy"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleFileDownload(
                                    file.id,
                                    file.original_filename
                                  )
                                }
                                className="ml-3 p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
                                title="Download file"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-4">
                  {/* Subtasks Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-green-100">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Subtasks
                        </h3>
                      </div>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="text-xs font-semibold bg-gray-200 text-gray-700 py-1 px-2 rounded-full">
                          {
                            task.subtasks.filter(
                              (s) => s.status === "completed"
                            ).length
                          }
                          /{task.subtasks.length}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <ul className="space-y-2">
                          {task.subtasks.map((subtask, index) => (
                            <li key={index} className="space-y-2">
                              <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                                <div
                                  className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${
                                    subtask.status === "completed"
                                      ? "bg-green-500"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  <CheckCircle2
                                    className={`w-3 h-3 ${
                                      subtask.status === "completed"
                                        ? "text-white"
                                        : "text-gray-400"
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span
                                    className={`text-sm font-medium block ${
                                      subtask.status === "completed"
                                        ? "line-through text-gray-500"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {subtask.title}
                                  </span>
                                </div>
                              </div>

                              {/* Subtask files */}
                              {subtask.files && subtask.files.length > 0 && (
                                <div className="ml-7 space-y-1.5">
                                  {subtask.files.map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-gray-900 truncate">
                                            {file.original_filename}
                                          </p>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <span>
                                              {formatFileSize(file.file_size)}
                                            </span>
                                            <span>•</span>
                                            <span>
                                              {format(
                                                new Date(file.created_at),
                                                "MMM dd"
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleFileDownload(
                                            file.id,
                                            file.original_filename
                                          )
                                        }
                                        className="ml-2 p-1 text-gray-400 hover:text-primary rounded-lg hover:bg-white transition-all"
                                        title="Download file"
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-center py-6">
                          <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No subtasks</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // History Timeline
            <div>
              {history.length === 0 ? (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
                  <div className="p-4 rounded-full bg-gray-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <HistoryIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    No history available
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Changes to this task will appear here
                  </p>
                </div>
              ) : (
                <div className="relative pl-2">
                  {/* Timeline Line */}
                  <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Timeline Items */}
                  <div className="space-y-6">
                    {history.map((item, index) => (
                      <div key={item.id} className="relative flex gap-5">
                        {/* Timeline Icon */}
                        <div className="flex-shrink-0 relative z-10">
                          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lg border-4 border-white">
                            {getChangeTypeIcon(item.change_type)}
                          </div>
                          {index < history.length - 1 && (
                            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-200"></div>
                          )}
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900">
                                {formatChangeType(item.change_type)}
                              </h4>
                            </div>
                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                              {format(
                                new Date(item.created_at),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>

                          <p className="text-gray-700 mb-3 leading-relaxed">
                            {item.change_description}
                          </p>

                          {item.changed_by_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <div className="p-1 rounded-full bg-gray-100">
                                <User className="w-3.5 h-3.5 text-gray-500" />
                              </div>
                              <span className="font-medium">
                                {item.changed_by_name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {format(new Date(item.created_at), "HH:mm")}
                              </span>
                            </div>
                          )}

                          {/* Show old/new values if available */}
                          {item.old_value && item.new_value && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                                      Previous
                                    </p>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 break-words">
                                    {item.old_value}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                      Updated
                                    </p>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 break-words">
                                    {item.new_value}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {task && (
        <TaskModal
          task={task}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TaskView;
