import api from './api';

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  assigned_to?: number;
  assigned_to_name?: string;
  assigned_to_email?: string;
  created_by: number;
  created_by_name?: string;
  assignment_date: string;
  due_date?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  tags?: string;
  notes?: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id?: number;
  task_id?: number;
  title: string;
  status: 'not_started' | 'completed';
}

export interface TaskSummary {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  blocked: number;
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
    const response = await api.get<{ tasks: Task[] }>('/tasks');
    return response.data.tasks;
  },

  getTaskById: async (id: number) => {
    const response = await api.get<{ task: Task }>(`/tasks/${id}`);
    return response.data.task;
  },

  createTask: async (taskData: Partial<Task>) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (id: number, taskData: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id: number) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getTaskSummary: async () => {
    const response = await api.get<{ summary: TaskSummary }>('/tasks/summary');
    return response.data.summary;
  },

  getTaskHistory: async (id: number) => {
    const response = await api.get<{ history: TaskHistory[] }>(`/tasks/${id}/history`);
    return response.data.history;
  },
};
