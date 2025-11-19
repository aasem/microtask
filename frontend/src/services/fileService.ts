import api from "./api";

export interface FileInfo {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_by_name?: string;
  uploaded_by_email?: string;
}

export const fileService = {
  uploadTaskFile: async (taskId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("task_id", taskId.toString());

    const response = await api.post("/files/task", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("uploadTaskFile", response);
    return response.data;
  },
  uploadSubtaskFile: async (subtaskId: number, file: File) => {
    console.log("fileService.uploadSubtaskFile called with:", {
      subtaskId,
      subtaskIdType: typeof subtaskId,
      fileName: file.name,
      fileSize: file.size,
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subtask_id", subtaskId.toString());

    console.log("FormData contents:");
    console.log("  subtask_id:", subtaskId.toString());
    console.log("  file:", file);

    const response = await api.post("/files/subtask", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Upload subtask file response:", response.data);
    return response.data;
  },

  getTaskFiles: async (taskId: number) => {
    const response = await api.get<{ files: FileInfo[] }>(
      `/files/task/${taskId}`
    );
    return response.data.files;
  },

  getSubtaskFiles: async (subtaskId: number) => {
    const response = await api.get<{ files: FileInfo[] }>(
      `/files/subtask/${subtaskId}`
    );
    return response.data.files;
  },

  downloadFile: async (fileId: number, filename: string) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteFile: async (fileId: number) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },
};
