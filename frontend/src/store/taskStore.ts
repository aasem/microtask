import { create } from 'zustand';
import { Task, TaskSummary, taskService } from '../services/taskService';

interface TaskState {
  tasks: Task[];
  summary: TaskSummary | null;
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  createTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (id: number, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  summary: null,
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await taskService.getAllTasks();
      set({ tasks, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch tasks', loading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await taskService.getTaskSummary();
      set({ summary });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch summary' });
    }
  },

  createTask: async (taskData: Partial<Task>) => {
    set({ loading: true, error: null });
    try {
      await taskService.createTask(taskData);
      await get().fetchTasks();
      await get().fetchSummary();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to create task', loading: false });
      throw error;
    }
  },

  updateTask: async (id: number, taskData: Partial<Task>) => {
    set({ loading: true, error: null });
    try {
      await taskService.updateTask(id, taskData);
      await get().fetchTasks();
      await get().fetchSummary();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update task', loading: false });
      throw error;
    }
  },

  deleteTask: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await taskService.deleteTask(id);
      await get().fetchTasks();
      await get().fetchSummary();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete task', loading: false });
      throw error;
    }
  },
}));
