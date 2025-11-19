import api from "./api";

export interface Tag {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  assigned_to_div?: number;
  assigned_to_div_name?: string;
  assigned_to_div_email?: string;
  assigned_to_div_user?: number;
  assigned_to_div_user_name?: string;
  created_by: number;
  created_by_name?: string;
  assignment_date: string;
  due_date?: string;
  status: "not_started" | "in_progress" | "completed" | "suspended";
  tags?: Tag[];
  notes?: string;
  subtasks?: Subtask[];
  files?: FileAttachment[];
}

export interface FileAttachment {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  _tempFile?: File; // For temporary files before upload
}

export interface Subtask {
  id?: number;
  task_id?: number;
  title: string;
  status: "not_started" | "completed";
  files?: FileAttachment[];
}

export interface TaskSummary {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  suspended: number;
  overdue: number;
}

export interface TaskHistory {
  id: number;
  change_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  change_description?: string;
  created_at: string;
  changed_by_name?: string;
  changed_by_email?: string;
}

export const taskService = {
  getAllTasks: async () => {
    const response = await api.get<{ tasks: Task[] }>("/tasks");
    return response.data.tasks;
  },

  getTaskById: async (id: number) => {
    const response = await api.get<{ task: Task }>(`/tasks/${id}`);
    return response.data.task;
  },

  createTask: async (taskData: Partial<Task>) => {
    const response = await api.post("/tasks", taskData);
    console.log("Backend response for createTask:", response.data);
    return response.data.task;
  },

  updateTask: async (id: number, taskData: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data.task;
  },

  deleteTask: async (id: number) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getTaskSummary: async () => {
    const response = await api.get<{ summary: TaskSummary }>("/tasks/summary");
    return response.data.summary;
  },

  getTaskHistory: async (id: number) => {
    const response = await api.get<{ history: TaskHistory[] }>(
      `/tasks/${id}/history`
    );
    return response.data.history;
  },
};
