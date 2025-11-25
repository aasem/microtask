import { useState, useEffect } from "react";
import { Plus, RotateCcw, Search, Printer } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import DashboardCards from "../components/DashboardCards";
import Toast from "../components/Toast";
import { useTaskStore } from "../store/taskStore";
import { useAuthStore } from "../store/authStore";
import { Task } from "../services/taskService";
import { Tag, tagService } from "../services/tagService";
import { canCreateTask, canDeleteTask, canEditTask } from "../utils/roleUtils";

const Dashboard = () => {
  const { user } = useAuthStore();
  const {
    tasks,
    summary,
    loading,
    error,
    fetchTasks,
    fetchSummary,
    createTask,
    updateTask,
    deleteTask,
  } = useTaskStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    dueDateRange: { start: "", end: "" },
    tags: [] as Tag[],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchSummary();
    fetchAvailableTags();
  }, [fetchTasks, fetchSummary]);

  const fetchAvailableTags = async () => {
    try {
      const tags = await tagService.getAllTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = async (task: Task) => {
    try {
      // Fetch full task details including subtasks
      const { taskService } = await import("../services/taskService");
      const fullTask = await taskService.getTaskById(task.id);
      setSelectedTask(fullTask);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch task details:", error);
      setToast({ message: "Failed to load task details", type: "error" });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
        setToast({ message: "Task deleted successfully", type: "success" });
      } catch (err) {
        setToast({ message: "Failed to delete task", type: "error" });
      }
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      let savedTask: Task;
      if (selectedTask) {
        savedTask = await updateTask(selectedTask.id, taskData);
        console.log("Updated task from store:", savedTask);
        setToast({ message: "Task updated successfully", type: "success" });
      } else {
        savedTask = await createTask(taskData);
        console.log("Created task from store:", savedTask);
        setToast({ message: "Task created successfully", type: "success" });
      }
      setIsModalOpen(false);
      console.log("Returning savedTask from handleSaveTask:", savedTask);
      return savedTask;
    } catch (err) {
      console.error("Error in handleSaveTask:", err);
      throw err;
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      dueDateRange: { start: "", end: "" },
      tags: [],
    });
    setSearchQuery("");
  };

  const handlePrint = () => {
    if (filteredTasks.length === 0) {
      setToast({ message: "No tasks to print", type: "info" });
      return;
    }

    // Helper function to get status color
    const getStatusColor = (status: string, isOverdue: boolean) => {
      if (isOverdue && status !== "completed") {
        return { bg: "#FEE2E2", text: "#B91C1C", border: "#B91C1C" };
      }
      switch (status) {
        case "completed":
          return { bg: "#D1FAE5", text: "#047857", border: "#047857" };
        case "in_progress":
          return { bg: "#DBEAFE", text: "#1E40AF", border: "#1E40AF" };
        case "suspended":
          return { bg: "#FEE2E2", text: "#B91C1C", border: "#B91C1C" };
        default:
          return { bg: "#DBEAFE", text: "#1E40AF", border: "#1E40AF" };
      }
    };

    // Helper function to format date
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
      } catch {
        return "N/A";
      }
    };

    // Helper function to format assignment date
    const formatDateOnly = (dateString: string | null | undefined) => {
      if (!dateString) return "N/A";
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch {
        return "N/A";
      }
    };

    // Check if task is overdue
    const isOverdue = (task: Task) => {
      return (
        task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== "completed"
      );
    };

    // Generate print HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Task List - ${new Date().toLocaleDateString()}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
                size: landscape;
              }
              .no-print {
                display: none;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 10px;
              line-height: 1.4;
              color: #1f2937;
              margin: 0;
              padding: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #002B5B;
              padding-bottom: 10px;
            }
            .header h1 {
              color: #002B5B;
              margin: 0;
              font-size: 18px;
              font-weight: bold;
            }
            .header p {
              color: #6b7280;
              margin: 4px 0 0 0;
              font-size: 10px;
            }
            .summary {
              margin-bottom: 15px;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              padding: 10px;
              background: #f9fafb;
              border-radius: 4px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 9px;
              color: #6b7280;
              margin-bottom: 2px;
            }
            .summary-value {
              font-size: 16px;
              font-weight: bold;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
            }
            thead {
              background: #002B5B;
              color: white;
            }
            th {
              padding: 6px 4px;
              text-align: left;
              font-weight: bold;
              font-size: 9px;
              border: 1px solid #002B5B;
            }
            td {
              padding: 6px 4px;
              border: 1px solid #e5e7eb;
              vertical-align: top;
            }
            tbody tr {
              page-break-inside: avoid;
            }
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            .status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              display: inline-block;
              margin-right: 4px;
              vertical-align: middle;
            }
            .task-title {
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 150px;
            }
            .task-description {
              font-size: 8px;
              color: #6b7280;
              max-width: 120px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .tags {
              display: flex;
              flex-wrap: wrap;
              gap: 2px;
            }
            .tag {
              padding: 2px 6px;
              border-radius: 8px;
              font-size: 8px;
              font-weight: 500;
              border: 1px solid;
              white-space: nowrap;
            }
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 9px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Task Management Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${hasActiveFilters ? `<p style="color: #dc2626; font-weight: 600;">Filtered View - Showing ${filteredTasks.length} of ${tasks.length} tasks</p>` : `<p>Total Tasks: ${filteredTasks.length}</p>`}
          </div>

          ${summary ? `
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total</div>
              <div class="summary-value" style="color: #4b5563;">${summary.total || 0}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">In Progress</div>
              <div class="summary-value" style="color: #1E40AF;">${summary.in_progress || 0}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Completed</div>
              <div class="summary-value" style="color: #047857;">${summary.completed || 0}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Overdue</div>
              <div class="summary-value" style="color: #B91C1C;">${summary.overdue || 0}</div>
            </div>
          </div>
          ` : ""}

          <table>
            <thead>
              <tr>
                <th style="width: 20px;"></th>
                <th style="width: 180px;">Title</th>
                <th style="width: 120px;">Description</th>
                <th style="width: 80px;">Status</th>
                <th style="width: 80px;">Created</th>
                <th style="width: 100px;">Due Date</th>
                <th style="width: 100px;">Division</th>
                <th style="width: 100px;">Assigned To</th>
                <th style="width: 120px;">Tags</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.map((task) => {
                const overdue = isOverdue(task);
                const colors = getStatusColor(task.status, overdue);
                const statusText = task.status === "suspended" ? "OVERDUE" : task.status === "in_progress" ? "IN PROGRESS" : task.status.toUpperCase();
                
                return `
                  <tr style="background: ${colors.bg};">
                    <td>
                      <span class="status-dot" style="background: ${colors.border};"></span>
                    </td>
                    <td>
                      <div class="task-title" style="color: ${colors.text}; font-weight: 600;">
                        ${task.title}
                      </div>
                    </td>
                    <td>
                      ${task.description ? `<div class="task-description" style="color: ${colors.text}; opacity: 0.8;">${task.description}</div>` : "-"}
                    </td>
                    <td style="color: ${colors.text}; font-weight: 600;">${statusText}</td>
                    <td style="color: ${colors.text};">${formatDateOnly(task.assignment_date)}</td>
                    <td style="color: ${colors.text}; ${overdue ? "font-weight: 600;" : ""}">${task.due_date ? formatDate(task.due_date) : "-"}</td>
                    <td style="color: ${colors.text};">${task.assigned_to_div_name || "-"}</td>
                    <td style="color: ${colors.text};">${task.assigned_to_div_user_name || "-"}</td>
                    <td>
                      ${task.tags && task.tags.length > 0 ? `
                        <div class="tags">
                          ${task.tags.map(tag => `
                            <span class="tag" style="background: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border};">
                              ${tag.name}
                            </span>
                          `).join("")}
                        </div>
                      ` : "-"}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>End of Report - Task Management System</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      const matchesTags = task.tags?.some(tag => 
        tag.name.toLowerCase().includes(query)
      );
      
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const taskTagIds = task.tags?.map(tag => tag.id) || [];
      const selectedTagIds = filters.tags.map(tag => tag.id);
      const hasMatchingTag = selectedTagIds.some(tagId => taskTagIds.includes(tagId));
      
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Due date range filter
    if (filters.dueDateRange.start && task.due_date) {
      if (new Date(task.due_date) < new Date(filters.dueDateRange.start)) {
        return false;
      }
    }
    if (filters.dueDateRange.end && task.due_date) {
      if (new Date(task.due_date) > new Date(filters.dueDateRange.end)) {
        return false;
      }
    }

    return true;
  });

  // Check if any filters are active
  const hasActiveFilters =
    filters.status !== "" ||
    filters.dueDateRange.start ||
    filters.dueDateRange.end ||
    filters.tags.length > 0 ||
    searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && <DashboardCards summary={summary} />}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 mt-2">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <Sidebar 
              filters={filters} 
              onFilterChange={setFilters} 
              availableTags={availableTags}
            />
          </div>

          {/* Task List */}
          <div className="flex-1 ml-3">
            <div className="flex justify-between items-center gap-4 mb-2">
              {/* Search Filter */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {filteredTasks.length > 0 && (
                  <button
                    onClick={handlePrint}
                    className="btn-secondary flex items-center space-x-2"
                    title="Print tasks"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Print</span>
                  </button>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Reset Filters</span>
                  </button>
                )}
                {user && canCreateTask(user.role) && (
                  <button
                    onClick={handleCreateTask}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-600">Loading tasks...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-danger text-danger px-4 py-3 rounded">
                {error}
              </div>
            )}

            {!loading && !error && filteredTasks.length === 0 && (
              <div className="text-center py-12 card flex flex-col align-center justify-center">
                {hasActiveFilters ? (
                  <p className="text-gray-600 text-center">
                    No tasks match the applied filters. Try adjusting your
                    filter criteria or reset filters to see all tasks.
                  </p>
                ) : (
                  <>
                    <p className="text-gray-600 text-center">No tasks found</p>
                    {user && canCreateTask(user.role) && (
                      <button
                        onClick={handleCreateTask}
                        className="mt-4 btn-accent w-auto self-center"
                      >
                        Create Your First Task
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {!loading && !error && filteredTasks.length > 0 && (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    canEdit={
                      user
                        ? canEditTask(
                            user.role,
                            task.assigned_to_div || 0,
                            user.id
                          )
                        : false
                    }
                    canDelete={user ? canDeleteTask(user.role) : false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
      />

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

export default Dashboard;
