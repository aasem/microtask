import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash,
  Edit,
  User,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Task, Subtask } from "../services/taskService";
import { useAuthStore } from "../store/authStore";
import { canAssignTasks } from "../utils/roleUtils";
import api from "../services/api";
import TagMultiSelect from "./TagMultiSelect";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

const TaskModal = ({ task, isOpen, onClose, onSave }: TaskModalProps) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    assigned_to: undefined,
    due_date: "",
    status: "not_started",
    tags: [],
    notes: "",
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigned_to: task.assigned_to,
        due_date: formatDateForInput(task.due_date),
        status: task.status,
        tags: task.tags || [],
        notes: task.notes,
      });
      setSubtasks(task.subtasks || []);
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assigned_to: undefined,
        due_date: "",
        status: "not_started",
        tags: [],
        notes: "",
      });
      setSubtasks([]);
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && canAssignTasks(user?.role || "")) {
      fetchUsers();
    }
  }, [isOpen, user]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubtask = () => {
    setSubtasks((prev) => [...prev, { title: "", status: "not_started" }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (
    index: number,
    field: keyof Subtask,
    value: string
  ) => {
    setSubtasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, [field]: value } : st))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert tags array to tag_ids for backend
      const taskData = {
        ...formData,
        tag_ids: formData.tags?.map(tag => tag.id) || [],
        subtasks,
      };
      // Remove tags field as we're sending tag_ids
      delete (taskData as any).tags;
      
      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canAssign = canAssignTasks(user?.role || "");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {task ? (
              <>
                <Edit className="w-5 h-5 text-accent" />
                Edit Task
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-primary" />
                Create New Task
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Info */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary">
              <div className="p-1 bg-primary bg-opacity-10 rounded">
                <span className="sr-only">Basic Information</span>
              </div>
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full"
                  placeholder="Enter task title"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full resize-none"
                  placeholder="Enter task description"
                />
              </div>
            </div>
          </div>

          {/* Assignment & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <h3 className="text-md font-semibold mb-3 flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-accent" />
                Assignment
              </h3>
              <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                {canAssign && (
                  <div className="form-group">
                    <label className="form-label">Assign To</label>
                    <select
                      name="assigned_to"
                      value={formData.assigned_to || ""}
                      onChange={handleChange}
                      className="w-full"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group mb-0">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date || ""}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-md font-semibold mb-3 flex items-center gap-2 text-gray-700">
                <AlertCircle className="w-4 h-4 text-accent" />
                Status & Priority
              </h3>
              <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["not_started", "in_progress", "completed", "blocked"].map(
                      (status) => (
                        <div
                          key={status}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              status: status as
                                | "not_started"
                                | "in_progress"
                                | "completed"
                                | "blocked",
                            })
                          }
                          className={`p-2 border rounded cursor-pointer flex items-center gap-2 transition-colors ${
                            formData.status === status
                              ? "border-accent bg-accent bg-opacity-5"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`status-dot ${
                              status === "completed"
                                ? "status-completed"
                                : status === "in_progress"
                                ? "status-in-progress"
                                : status === "blocked"
                                ? "status-blocked"
                                : "status-not-started"
                            }`}
                          ></span>
                          <span className="text-sm">
                            {status
                              .replace("_", " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                  <input type="hidden" name="status" value={formData.status} />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["low", "medium", "high"].map((priority) => (
                      <div
                        key={priority}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            priority: priority as "high" | "medium" | "low",
                          })
                        }
                        className={`p-2 border rounded cursor-pointer flex justify-center items-center gap-1 transition-colors ${
                          formData.priority === priority
                            ? "border-accent bg-accent bg-opacity-5"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            priority === "high"
                              ? "bg-danger"
                              : priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></span>
                        <span className="text-sm capitalize">{priority}</span>
                      </div>
                    ))}
                  </div>
                  <input
                    type="hidden"
                    name="priority"
                    value={formData.priority}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <TagMultiSelect
              selectedTags={formData.tags || []}
              onChange={(tags) => setFormData({ ...formData, tags })}
              placeholder="Select or add tags..."
            />
          </div>

          {/* Subtasks */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold flex items-center gap-2 text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Subtasks
              </h3>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="btn-outline py-1.5 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subtask
              </button>
            </div>

            {subtasks.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No subtasks added yet
              </p>
            ) : (
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200"
                  >
                    <input
                      type="text"
                      value={subtask.title}
                      onChange={(e) =>
                        handleSubtaskChange(index, "title", e.target.value)
                      }
                      placeholder="Subtask title"
                      className="flex-1 border-0 focus:ring-0 p-0 text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <select
                        value={subtask.status}
                        onChange={(e) =>
                          handleSubtaskChange(
                            index,
                            "status",
                            e.target.value as "not_started" | "completed"
                          )
                        }
                        className="border-0 py-1 pl-2 pr-7 rounded text-sm bg-gray-50"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(index)}
                        className="p-1 text-gray-400 hover:text-danger rounded-full hover:bg-gray-100"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows={4}
              className="w-full"
              placeholder="Add any additional notes or comments"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {task ? "Updating..." : "Creating..."}
                </>
              ) : task ? (
                "Update Task"
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
