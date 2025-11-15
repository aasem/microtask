import { useState, useEffect } from "react";
import { Plus, RotateCcw } from "lucide-react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import DashboardCards from "../components/DashboardCards";
import Toast from "../components/Toast";
import { useTaskStore } from "../store/taskStore";
import { useAuthStore } from "../store/authStore";
import { Task } from "../services/taskService";
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
    priority: [] as string[],
    status: "",
    dueDateRange: { start: "", end: "" },
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchSummary();
  }, [fetchTasks, fetchSummary]);

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
      if (selectedTask) {
        await updateTask(selectedTask.id, taskData);
        setToast({ message: "Task updated successfully", type: "success" });
      } else {
        await createTask(taskData);
        setToast({ message: "Task created successfully", type: "success" });
      }
      setIsModalOpen(false);
    } catch (err) {
      throw err;
    }
  };

  const handleResetFilters = () => {
    setFilters({
      priority: [],
      status: "",
      dueDateRange: { start: "", end: "" },
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Priority filter
    if (
      filters.priority.length > 0 &&
      !filters.priority.includes(task.priority)
    ) {
      return false;
    }

    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
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
    filters.priority.length > 0 ||
    filters.status !== "" ||
    filters.dueDateRange.start ||
    filters.dueDateRange.end;

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
            <Sidebar filters={filters} onFilterChange={setFilters} />
          </div>

          {/* Task List */}
          <div className="flex-1 ml-3">
            <div className="flex justify-end items-center gap-2 mb-2">
              {/* <h2 className="text-2xl font-bold text-gray-900">
                Tasks ({filteredTasks.length})
              </h2> */}
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
                        ? canEditTask(user.role, task.assigned_to || 0, user.id)
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
