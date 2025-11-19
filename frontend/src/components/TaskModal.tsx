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
  Upload,
  Download,
  File,
} from "lucide-react";
import { Task, Subtask, FileAttachment } from "../services/taskService";
import { useAuthStore } from "../store/authStore";
import { canAssignTasks } from "../utils/roleUtils";
import api from "../services/api";
import TagMultiSelect from "./TagMultiSelect";
import { divUserService, DivUser } from "../services/divUserService";
import { fileService } from "../services/fileService";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<Task>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

type TaskStatus = "not_started" | "in_progress" | "completed" | "suspended";
type TaskFormData = Omit<Partial<Task>, "status"> & { status?: TaskStatus };

const TaskModal = ({ task, isOpen, onClose, onSave }: TaskModalProps) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    assigned_to_div: undefined,
    assigned_to_div_user: undefined,
    due_date: "",
    status: "not_started",
    tags: [],
    notes: "",
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [divUsers, setDivUsers] = useState<DivUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDivUserModalOpen, setIsDivUserModalOpen] = useState(false);
  const [newDivUserData, setNewDivUserData] = useState({
    name: "",
    user_id: undefined as number | undefined,
  });
  const [taskFiles, setTaskFiles] = useState<FileAttachment[]>(task?.files || []);
  const [subtaskFiles, setSubtaskFiles] = useState<{
    [subtaskIndex: number]: FileAttachment[];
  }>({});

  // Helper function to format date for HTML datetime-local input (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const loadSubtaskFiles = async () => {
      if (task?.subtasks) {
        const files: { [subtaskIndex: number]: FileAttachment[] } = {};
        for (let i = 0; i < task.subtasks.length; i++) {
          const subtask = task.subtasks[i];
          if (subtask.id) {
            try {
              const subtaskFilesList = await fileService.getSubtaskFiles(
                subtask.id
              );
              files[i] = subtaskFilesList;
            } catch (error) {
              console.error(
                `Failed to load files for subtask ${subtask.id}:`,
                error
              );
              files[i] = [];
            }
          }
        }
        setSubtaskFiles(files);
      } else {
        setSubtaskFiles({});
      }
    };

    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigned_to_div: task.assigned_to_div,
        assigned_to_div_user: task.assigned_to_div_user,
        due_date: formatDateForInput(task.due_date),
        status: task.status,
        tags: task.tags || [],
        notes: task.notes,
      });
      setSubtasks(task.subtasks || []);
      setTaskFiles(task.files || []);
      loadSubtaskFiles();
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assigned_to_div: undefined,
        assigned_to_div_user: undefined,
        due_date: "",
        status: "not_started",
        tags: [],
        notes: "",
      });
      setSubtasks([]);
      setTaskFiles([]);
      setSubtaskFiles({});
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && canAssignTasks(user?.role || "")) {
      fetchUsers();
      fetchDivUsers();
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

  const fetchDivUsers = async () => {
    try {
      const divUsersData = await divUserService.getAllDivUsers();
      setDivUsers(divUsersData);
    } catch (error) {
      console.error("Failed to fetch div users:", error);
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
    // Clean up subtask files
    setSubtaskFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[index];
      // Shift indices for remaining subtasks
      const shiftedFiles: { [subtaskIndex: number]: FileAttachment[] } = {};
      Object.keys(newFiles).forEach((key) => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          shiftedFiles[keyIndex - 1] = newFiles[keyIndex];
        } else if (keyIndex < index) {
          shiftedFiles[keyIndex] = newFiles[keyIndex];
        }
      });
      return shiftedFiles;
    });
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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    subtaskIndex?: number
  ) => {
    if (!e.target.files) return;
    console.log("file", e.target.files);
    const file = e.target.files[0];
    setUploadingFile(true);

    try {
      if (subtaskIndex !== undefined) {
        // Upload to subtask
        const subtask = subtasks[subtaskIndex];
        if (subtask.id) {
          // Existing subtask with ID
          await fileService.uploadSubtaskFile(subtask.id, file);
          // Refresh subtask files
          const updatedFiles = await fileService.getSubtaskFiles(subtask.id);
          setSubtaskFiles((prev) => ({
            ...prev,
            [subtaskIndex]: updatedFiles,
          }));
          alert("File uploaded successfully!");
        } else {
          // New subtask - store file temporarily until subtask is created
          const tempFile: FileAttachment = {
            id: Date.now(), // Temporary ID
            filename: file.name,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            created_at: new Date().toISOString(),
            _tempFile: file, // Store the actual file object
          };
          setSubtaskFiles((prev) => ({
            ...prev,
            [subtaskIndex]: [...(prev[subtaskIndex] || []), tempFile],
          }));
        }
      } else {
        // Upload to task
        if (task?.id) {
          // Existing task
          await fileService.uploadTaskFile(task.id, file);
          // Refresh task files
          const updatedFiles = await fileService.getTaskFiles(task.id);
          console.log("updatedFiles", updatedFiles);
          setTaskFiles(updatedFiles);
          alert("File uploaded successfully!");
        } else {
          // New task - store file temporarily until task is created
          const tempFile: FileAttachment = {
            id: Date.now(), // Temporary ID
            filename: file.name,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type,
            created_at: new Date().toISOString(),
            _tempFile: file, // Store the actual file object
          };
          setTaskFiles((prev) => [...prev, tempFile]);
        }
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert("Failed to upload file");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleFileDownload = async (fileId: number, filename: string) => {
    try {
      await fileService.downloadFile(fileId, filename);
    } catch (error) {
      console.error("Failed to download file:", error);
      alert("Failed to download file");
    }
  };

  const handleFileDelete = async (fileId: number, subtaskIndex?: number) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      // Check if it's a temporary file (has _tempFile property)
      let isTempFile = false;

      if (subtaskIndex !== undefined) {
        const subtaskFilesList = subtaskFiles[subtaskIndex] || [];
        const file = subtaskFilesList.find((f) => f.id === fileId);
        if (file?._tempFile) {
          isTempFile = true;
          // Remove from local state
          setSubtaskFiles((prev) => ({
            ...prev,
            [subtaskIndex]:
              prev[subtaskIndex]?.filter((f) => f.id !== fileId) || [],
          }));
        }
      } else {
        const file = taskFiles.find((f) => f.id === fileId);
        if (file?._tempFile) {
          isTempFile = true;
          // Remove from local state
          setTaskFiles((prev) => prev.filter((f) => f.id !== fileId));
        }
      }

      if (!isTempFile) {
        // Delete from server
        await fileService.deleteFile(fileId);
      }

      alert("File deleted successfully!");
    } catch (error) {
      console.error("Failed to delete file:", error);
      alert("Failed to delete file");
    }
  };

  const handleCreateDivUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivUserData.user_id) {
      alert("Please select a user");
      return;
    }
    const userId = newDivUserData.user_id; // TypeScript now knows this is a number
    try {
      await divUserService.createDivUser({
        name: newDivUserData.name,
        user_id: userId,
      });
      alert("DivUser created successfully!");
      setIsDivUserModalOpen(false);
      setNewDivUserData({ name: "", user_id: undefined });
      // Refresh DivUsers list
      await fetchDivUsers();
    } catch (error) {
      console.error("Failed to create DivUser:", error);
      alert("Failed to create DivUser");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert tags array to tag_ids for backend
      const taskData = {
        ...formData,
        tag_ids: formData.tags?.map((tag) => tag.id) || [],
        subtasks,
      };
      // Remove tags field as we're sending tag_ids
      delete (taskData as any).tags;

      // Save the task/subtask
      const savedTask = await onSave(taskData);

      console.log("SavedTask received:", savedTask);

      if (!savedTask || !savedTask.id) {
        console.error("SavedTask is invalid:", savedTask);
        alert("Task was created but ID is missing. Files cannot be uploaded.");
        onClose();
        return;
      }

      // Upload temporary task files if any
      if (taskFiles.length > 0) {
        for (const file of taskFiles) {
          if (file._tempFile) {
            try {
              await fileService.uploadTaskFile(savedTask.id, file._tempFile);
            } catch (error) {
              console.error("Failed to upload task file:", error);
              alert(`Failed to upload file: ${file.original_filename}`);
            }
          }
        }
      }

      // Upload temporary subtask files if any
      console.log("Subtask files to upload:", subtaskFiles);
      console.log("Saved task subtasks:", savedTask.subtasks);

      for (const [subtaskIndex, files] of Object.entries(subtaskFiles)) {
        const index = parseInt(subtaskIndex);
        console.log(`Processing subtask index ${index}, files:`, files);

        if (files && files.length > 0) {
          // Find the corresponding saved subtask
          const savedSubtask = savedTask.subtasks?.[index];
          console.log(`Saved subtask at index ${index}:`, savedSubtask);

          if (savedSubtask?.id) {
            console.log(`Uploading files for subtask ID ${savedSubtask.id}`);
            for (const file of files) {
              if (file._tempFile) {
                try {
                  console.log(
                    `Uploading file ${file.original_filename} to subtask ${savedSubtask.id}`
                  );
                  await fileService.uploadSubtaskFile(
                    savedSubtask.id,
                    file._tempFile
                  );
                  console.log(
                    `Successfully uploaded ${file.original_filename}`
                  );
                } catch (error) {
                  console.error("Failed to upload subtask file:", error);
                  alert(
                    `Failed to upload file for subtask: ${file.original_filename}`
                  );
                }
              }
            }
          } else {
            console.warn(
              `No saved subtask found at index ${index} or missing ID`
            );
          }
        }
      }

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
                  <>
                    <div className="form-group">
                      <label className="form-label">Assign to (Div)</label>
                      <select
                        name="assigned_to_div"
                        value={formData.assigned_to_div || ""}
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

                    <div className="form-group">
                      <div className="flex items-center justify-between mb-2">
                        <label className="form-label mb-0">
                          Assign to (DDG/ADDG)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsDivUserModalOpen(true)}
                          className="flex items-center bg-primary bg-opacity-10 rounded-full px-2 py-1 gap-1 text-xs text-primary hover:text-accent font-medium"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>
                      <select
                        name="assigned_to_div_user"
                        value={formData.assigned_to_div_user || ""}
                        onChange={handleChange}
                        className="w-full"
                      >
                        <option value="">Unassigned</option>
                        {divUsers.map((du) => (
                          <option key={du.id} value={du.id}>
                            {du.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="form-group mb-0">
                  <label className="form-label">Due Date & Time</label>
                  <input
                    type="datetime-local"
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
                    {[
                      "not_started",
                      "in_progress",
                      "completed",
                      "suspended",
                    ].map(
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
                                | "suspended",
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
                              : status === "suspended"
                              ? "status-suspended"
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
              <div className="space-y-3">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-2 bg-white p-3 rounded border border-gray-200">
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
                        <label className="cursor-pointer p-1 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(e, index)}
                            className="hidden"
                            disabled={uploadingFile}
                          />
                        </label>
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

                    {/* Subtask files */}
                    {subtaskFiles[index]?.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {subtaskFiles[index].map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <File className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {file.original_filename}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.file_size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleFileDownload(
                                    file.id,
                                    file.original_filename
                                  )
                                }
                                className="p-1 text-gray-400 hover:text-primary rounded-full hover:bg-gray-50"
                                disabled={file._tempFile !== undefined}
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFileDelete(file.id, index)}
                                className="p-1 text-gray-400 hover:text-danger rounded-full hover:bg-gray-50"
                              >
                                <Trash className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold flex items-center gap-2 text-gray-700">
                <File className="w-4 h-4 text-accent" />
                File Attachments
              </h3>
              <label className="btn-outline py-1.5 px-3 text-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Upload File
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e)}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>
            </div>

            {uploadingFile && (
              <p className="text-sm text-gray-500 mb-2">Uploading...</p>
            )}

            {taskFiles.length > 0 ? (
              <div className="space-y-2">
                {taskFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.original_filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.file_size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleFileDownload(file.id, file.original_filename)
                        }
                        className="p-1 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100"
                        disabled={file._tempFile !== undefined} // Disable download for temp files
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canAssign && (
                        <button
                          type="button"
                          onClick={() => handleFileDelete(file.id)}
                          className="p-1 text-gray-400 hover:text-danger rounded-full hover:bg-gray-100"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No files attached yet
              </p>
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

      {/* DivUser Creation Modal */}
      {isDivUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Add DDG/ADDG
                </h3>
                <button
                  onClick={() => {
                    setIsDivUserModalOpen(false);
                    setNewDivUserData({
                      name: "",
                      user_id: undefined,
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateDivUser} className="p-6 space-y-4">
              <div className="form-group">
                <label className="form-label">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newDivUserData.name}
                  onChange={(e) =>
                    setNewDivUserData({
                      ...newDivUserData,
                      name: e.target.value,
                    })
                  }
                  required
                  className="w-full"
                  placeholder="Enter name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Div <span className="text-danger">*</span>
                </label>
                <select
                  value={newDivUserData.user_id || ""}
                  onChange={(e) =>
                    setNewDivUserData({
                      ...newDivUserData,
                      user_id: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  required
                  className="w-full"
                >
                  <option value="">Select a Div</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsDivUserModalOpen(false);
                    setNewDivUserData({
                      name: "",
                      user_id: undefined,
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModal;
